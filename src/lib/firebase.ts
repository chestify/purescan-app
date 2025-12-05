import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCxWUt44EOrK1YosbjvY46lJlKV4jmzDK8",
  authDomain: "purescan-a61f4.firebaseapp.com",
  projectId: "purescan-a61f4",
  storageBucket: "purescan-a61f4.firebasestorage.app",
  messagingSenderId: "746315669754",
  appId: "1:746315669754:web:2246003860e1c9d003a943"
}

// Prevent multiple initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
