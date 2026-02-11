import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgR7l8aWZWRWaF_BVPWy8K5jnwatHJMGI",
  authDomain: "amrah-by-arabian-ai.firebaseapp.com",
  projectId: "amrah-by-arabian-ai",
  storageBucket: "amrah-by-arabian-ai.firebasestorage.app",
  messagingSenderId: "534306241121",
  appId: "1:534306241121:web:032c76e8211626a030c820",
  measurementId: "G-K4BCMNCJE2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;