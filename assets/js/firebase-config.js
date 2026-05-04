import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAALOb7Mohe98nmjjktfxPqcttm9wqKsgA",
  authDomain: "pcca-web.firebaseapp.com",
  projectId: "pcca-web",
  storageBucket: "pcca-web.firebasestorage.app",
  messagingSenderId: "1068431151663",
  appId: "1:1068431151663:web:b9a637660e4fd34f4a6cda",
  measurementId: "G-HY569GB7YY"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);