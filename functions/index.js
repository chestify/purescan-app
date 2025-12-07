// --- Firebase Functions v2 imports ---
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * ================================================================
 * 1. AUTOMATIC SAFETY SCORE RECALCULATION (FIRESTORE TRIGGER)
 * ================================================================
 */
exports.calculateSafetyScore = onDocumentWritten("products/{productId}", async (event) => {
  const productId = event.params.productId;

  const productData = event.data?.after?.data();
  const previousProductData = event.data?.before?.data();

  console.log("Recalculating safety score for product:", productId);

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

    const risk = ingSnap.data().risk || 0;
    totalRisk += risk;
  }

  // Safety score formula
  const score = Math.max(0, 100 - Math.min(100, 20 * Math.log(1 + totalRisk)));

  let safetyColor = "green";
  if (score < 50) safetyColor = "red";
  else if (score < 85) safetyColor = "yellow";

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
 */
exports.lookupProduct = onRequest(async (req, res) => {
  const barcode = req.query.barcode;

  if (!barcode) {
    res.status(400).json({ error: "Missing barcode" });
    return;
  }

  const snap = await db
    .collection("products")
    .where("barcode", "==", barcode)
    .get();

  if (snap.empty) {
    res.json({
      status: "not_found",
      message: "Product not yet in database",
    });
    return;
  }

  const productDoc = snap.docs[0];
  res.json({
    id: productDoc.id,
    ...productDoc.data(),
  });
});


