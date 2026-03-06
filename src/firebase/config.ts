import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  "projectId": "festx-hackathon",
  "appId": "1:684294431428:web:bd83adf239bdc068eb9f91",
  "apiKey": "AIzaSyBASuoZVppVzkYwSk2J7plNF2xr0d5pnF0",
  "authDomain": "festx-hackathon.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "684294431428",
  "storageBucket": "festx-hackathon.appspot.com"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
