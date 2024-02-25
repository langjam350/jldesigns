import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABT8Hit4g8crgGSaj0TDn5fUiTR7a1OXo",
  authDomain: "jldesigns.firebaseapp.com",
  projectId: "jldesigns",
  storageBucket: "jldesigns.appspot.com",
  messagingSenderId: "799366775318",
  appId: "1:799366775318:web:ec1be53d16c32d1aaaeb37"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };