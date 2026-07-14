import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2sDgsWPRrxrVW1t8ZywHOcLEXM8nI4mc",
  authDomain: "gen-lang-client-0997553730.firebaseapp.com",
  projectId: "gen-lang-client-0997553730",
  storageBucket: "gen-lang-client-0997553730.firebasestorage.app",
  messagingSenderId: "202871594350",
  appId: "1:202871594350:web:b86a4304c81f1cec07757f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-psbvoucherregist-d469e7df-806d-45f2-8134-8a03f7095901");
