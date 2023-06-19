// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCWNj1Va77hvYAm7-jhKko_XZ33RCCfRu0",
    authDomain: "dibby-mobile.firebaseapp.com",
    projectId: "dibby-mobile",
    storageBucket: "dibby-mobile.appspot.com",
    messagingSenderId: "779409582192",
    appId: "1:779409582192:web:fb95a66f381911f2a96cb5",
    measurementId: "G-J51GMLRN8F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
