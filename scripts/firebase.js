import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDpvvANrVGVf3ZKfKYDhutJ48lFGuzvv-k",
    authDomain: "knjigolovac-a6e86.firebaseapp.com",
    projectId: "knjigolovac-a6e86",
    storageBucket: "knjigolovac-a6e86.firebasestorage.app",
    messagingSenderId: "214796177817",
    appId: "1:214796177817:web:9eaad575923d672c0c8308",
    measurementId: "G-PR4P7D1NXZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();
const db1 = getFirestore(app);

export  {app, auth, db, db1};
