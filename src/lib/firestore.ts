import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

// Get product by barcode
export async function getProductByBarcode(barcode: string) {
  const q = query(collection(db, "products"), where("barcode", "==", barcode))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const productDoc = snapshot.docs[0]
  return { id: productDoc.id, ...productDoc.data() }
}

// Get product ingredients
export async function getIngredientsByProductId(productId: string) {
  const q = query(collection(db, "productIngredients"), where("productId", "==", productId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Get ingredient risk data
export async function getIngredientById(id: string) {
  const ref = doc(db, "ingredients", id)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}
