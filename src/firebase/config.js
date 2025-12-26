import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBASuoZVppVzkYwSk2J7plNF2xr0d5pnF0",
  authDomain: "festx-hackathon.firebaseapp.com",
  projectId: "festx-hackathon",
  storageBucket: "festx-hackathon.appspot.com",
  messagingSenderId: "684294431428",
  appId: "1:684294431428:web:bd83adf239bdc068eb9f91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
