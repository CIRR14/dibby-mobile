// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { FacebookAuthProvider, GoogleAuthProvider, OAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"
import {
    REACT_APP_API_KEY,
    REACT_APP_AUTH_DOMAIN,
    REACT_APP_PROJECT_ID,
    REACT_APP_STORAGE_BUCKET,
    REACT_APP_MESSAGING_SENDER_ID,
    REACT_APP_APP_ID,
    REACT_APP_MEASUREMENT_ID 
} from '@env'
import { Platform } from "react-native";





// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

let firebaseConfig = {};

if (Platform.OS === 'web') { 
    firebaseConfig = {
        apiKey: process.env.REACT_APP_API_KEY,
        authDomain: process.env.REACT_APP_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_PROJECT_ID,
        storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_APP_ID,
        measurementId: process.env.EACT_APP_MEASUREMENT_ID 
    };
} else {
    firebaseConfig = {
        apiKey: REACT_APP_API_KEY,
        authDomain: REACT_APP_AUTH_DOMAIN,
        projectId: REACT_APP_PROJECT_ID,
        storageBucket: REACT_APP_STORAGE_BUCKET,
        messagingSenderId: REACT_APP_MESSAGING_SENDER_ID,
        appId: REACT_APP_APP_ID,
        measurementId:REACT_APP_MEASUREMENT_ID 
    };

}



// Initialize Firebase
const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const facebookProvider = new FacebookAuthProvider();
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

