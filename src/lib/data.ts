// Ingredient document stored in Firestore
export type Ingredient = {
  id: string;            // Firestore document ID
  name: string;
  description?: string;
  risk?: number;         // Firestore uses "risk" or "riskWeight"
  riskWeight?: number;   // Migration-safe fallback
};

// Product document stored in Firestore
export type Product = {
  id: string;            // Firestore document ID (NOT barcode)
  barcode: string;
  name: string;
  brand: string;
  imageUrlId?: string;

  // These fields are now computed + stored by Cloud Functions
  safetyScore?: number;
  safetyColor?: "green" | "yellow" | "red";

  updatedAt?: any;
};
