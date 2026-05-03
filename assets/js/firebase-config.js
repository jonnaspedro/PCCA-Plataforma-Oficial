import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfigData } from "./firebase-env.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfigData);

export const auth = getAuth(app);
export const db = getFirestore(app);