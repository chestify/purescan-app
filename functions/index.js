const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Automatically recalculates safetyScore + safetyColor
 * whenever a product is created or updated.
 */
exports.calculateSafetyScore = onDocumentWritten("products/{productId}", async (event) => {
  const productId = event.params.productId;
  const productData = event.data?.after.data();
  const previousProductData = event.data?.before.data();

  // Exit if the write did not change the data relevant to the score
  if (productData?.safetyScore && productData.safetyScore === previousProductData?.safetyScore) {
    console.log("No score change, exiting function for product:", productId);
    return;
  }
  
  console.log("Recalculating safety score for product:", productId);

  // 1. Get all productIngredients for this product
  const piSnap = await db
    .collection("productIngredients")
    .where("productId", "==", productId)
    .get();

  if (piSnap.empty) {
    console.log("No ingredients found for product:", productId);
    return null;
  }

  let totalRisk = 0;

  // 2. For each linked ingredient, get riskWeight
  for (const docSnap of piSnap.docs) {
    const { ingredientId } = docSnap.data();
    const ingSnap = await db.collection("ingredients").doc(ingredientId).get();
    if (!ingSnap.exists) continue;
    const ing = ingSnap.data();
    const risk = ing.risk || 0;
    totalRisk += risk;
  }

  // 3. Apply formula to convert total risk to 0–100 safety score
  const score = Math.max(0, 100 - Math.min(100, 20 * Math.log(1 + totalRisk)));

  let safetyColor = "green";
  if (score < 50) safetyColor = "red";
  else if (score < 85) safetyColor = "yellow";

  // 4. Save score back to the product
  await db.collection("products").doc(productId).update({
    safetyScore: score,
    safetyColor: safetyColor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Updated product score:", score, "color:", safetyColor);
  return null;
});

/**
 * API endpoint:
 * GET /products/lookup?barcode=XXXX
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
