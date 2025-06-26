import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration – falls back to hard-coded demo config when __firebase_config global is absent.
const firebaseConfig = typeof __firebase_config !== "undefined"
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyCBv6J7ZInJ2-CX57ksZDjpmLqvO8sgJuQ",
      authDomain: "byot-40fe2.firebaseapp.com",
      projectId: "byot-40fe2",
      storageBucket: "byot-40fe2.appspot.com",
      messagingSenderId: "643015540811",
      appId: "1:643015540811:web:f8b609d7b2e6408607cdce",
      measurementId: "G-S8QD6WWN90"
    };

// Initialise Firebase services once and re-export them for reuse across the app.
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== "undefined" ? __app_id : "byot-40fe2";

export default app;
