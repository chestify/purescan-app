const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Automatically recalculates safetyScore + safetyColor
 * whenever a product is created or updated.
 */
exports.calculateSafetyScore = functions.firestore
  .document("products/{productId}")
  .onWrite(async (change, context) => {
    const productId = context.params.productId;

    const data = change.after.data();
    const oldData = change.before.data();

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

    // Prevent infinite loops by only writing if the score has changed
    if (oldData && oldData.safetyScore === score) {
        console.log("Score is unchanged. Exiting function for product:", productId);
        return null;
    }

    let safetyColor = "green";
    if (score < 50) safetyColor = "red";
    else if (score < 85) safetyColor = "yellow";

    // 4. Save score back to the product
    await db.collection("products").doc(productId).update({
      safetyScore: score,
      safetyColor: safetyColor,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Updated product score for", productId, ":", score, "color:", safetyColor);

    return null;
  });

/**
 * API endpoint:
 * GET /products/lookup?barcode=XXXX
 */
exports.lookupProduct = functions.https.onRequest(async (req, res) => {
  const barcode = req.query.barcode;

  if (!barcode) {
    return res.status(400).json({ error: "Missing barcode" });
  }

  const snap = await db
    .collection("products")
    .where("barcode", "==", barcode)
    .get();

  if (snap.empty) {
    return res.json({
      status: "not_found",
      message: "Product not yet in database",
    });
  }

  const productDoc = snap.docs[0];
  return res.json({
    id: productDoc.id,
    ...productDoc.data(),
  });
});
