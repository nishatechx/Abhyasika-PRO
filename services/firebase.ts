
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDfk0uPeCRN8CI7YwntQvupyj0eYt3B8zU",
  authDomain: "abhyasika-pro-35cf7.firebaseapp.com",
  projectId: "abhyasika-pro-35cf7",
  storageBucket: "abhyasika-pro-35cf7.firebasestorage.app",
  messagingSenderId: "1072366481027",
  appId: "1:1072366481027:web:79c3dc7b37763d30eef5b6",
  measurementId: "G-HM4Q4Y57Z5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to handle environments where it's not supported
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
}).catch(console.warn);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
