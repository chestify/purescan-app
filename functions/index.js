// --- Firebase Functions v2 imports ---
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Admin SDK once
admin.initializeApp();
const db = admin.firestore();

/**
 * ================================================================
 * 1. AUTOMATIC SAFETY SCORE RECALCULATION (FIRESTORE TRIGGER)
 * ================================================================
 * This function triggers when a product document is written.
 * It prevents infinite loops by checking if the score has changed.
 */
exports.calculateSafetyScore = onDocumentWritten("products/{productId}", async (event) => {
  const productId = event.params.productId;

  const productDataAfter = event.data?.after?.data();
  const productDataBefore = event.data?.before?.data();

  // Fetch ingredient link documents
  const piSnap = await db
    .collection("productIngredients")
    .where("productId", "==", productId)
    .get();

  if (piSnap.empty) {
    console.log("No ingredients linked to product:", productId);
    return null;
  }

  let totalRisk = 0;

  // Loop linked ingredients
  for (const docSnap of piSnap.docs) {
    const { ingredientId } = docSnap.data();

    const ingSnap = await db.collection("ingredients").doc(ingredientId).get();
    if (!ingSnap.exists) continue;

    // Use riskWeight for score, fallback to risk
    const risk = ingSnap.data().riskWeight ?? ingSnap.data().risk ?? 0;
    totalRisk += risk;
  }

  // Safety score formula
  const score = Math.max(0, 100 - Math.min(100, 20 * Math.log(1 + totalRisk)));

  let safetyColor = "green";
  if (score < 50) safetyColor = "red";
  else if (score < 85) safetyColor = "yellow";

  // Check if score has actually changed to prevent infinite loop
  if (productDataAfter?.safetyScore === score && productDataAfter?.safetyColor === safetyColor) {
      console.log("Score is unchanged for", productId, "- skipping update.");
      return null;
  }

  // Save updated score
  await db.collection("products").doc(productId).update({
    safetyScore: score,
    safetyColor: safetyColor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Updated:", { productId, score, safetyColor });
  return null;
});


/**
 * ================================================================
 * 2. LOOKUP PRODUCT BY BARCODE (PUBLIC HTTP ENDPOINT)
 * ================================================================
 * API endpoint: GET /lookupProduct?barcode=XXXX
 * If product exists → returns it with status: "existing"
 * If not → creates a placeholder product and returns status: "new"
 */
exports.lookupProduct = onRequest(async (req, res) => {
  const barcode = req.query.barcode;

  if (!barcode) {
    res.status(400).json({ error: "Missing barcode" });
    return;
  }

  try {
    const snap = await db
      .collection("products")
      .where("barcode", "==", barcode)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      res.json({
        status: "existing",
        id: doc.id,
        ...doc.data(),
      });
      return;
    }

    const newProductRef = db.collection("products").doc(barcode);
    const newProductData = {
      barcode,
      name: "New product",
      brand: "",
      description: "",
      imageUrlId: "placeholder",
      isNew: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await newProductRef.set(newProductData);

    res.json({
      status: "new",
      id: newProductRef.id,
      ...newProductData,
    });
  } catch (err) {
    console.error("lookupProduct error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});