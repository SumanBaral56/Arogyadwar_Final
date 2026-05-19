import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { createContext, useContext } from "react";

const FirebaseContext = createContext(null);

const firebaseConfig = {
  apiKey: "AIzaSyBf-9Oj5F9EEGa38OxggzNx7FfFhqGEkoE",
  authDomain: "arogyadwar-90150.firebaseapp.com",
  databaseURL: "https://arogyadwar-90150-default-rtdb.firebaseio.com",
  projectId: "arogyadwar-90150",
  storageBucket: "arogyadwar-90150.firebasestorage.app",
  messagingSenderId: "504565614817",
  appId: "1:504565614817:web:753c0aa0a1efa1424dcfa0",
  measurementId: "G-C0QS2YZ80F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const useFirebase = () => useContext(FirebaseContext);