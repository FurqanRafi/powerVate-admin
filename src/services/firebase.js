// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzpKQqJ_QLpti7asXOyiL5CZkWSLdVzHg",
  authDomain: "powervate-fitness.firebaseapp.com",
  databaseURL: "https://powervate-fitness-default-rtdb.firebaseio.com",
  projectId: "powervate-fitness",
  storageBucket: "powervate-fitness.firebasestorage.app",
  messagingSenderId: "923547972596",
  appId: "1:923547972596:web:0904843eb22e5d996f7fa1",
  measurementId: "G-L0XBBDPSP1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);