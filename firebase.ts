import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBhysbsfzayPCqlAz4tp0CKIj5h13p3iGA",
  authDomain: "thematic-d0e45.firebaseapp.com",
  databaseURL: "https://thematic-d0e45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thematic-d0e45",
  storageBucket: "thematic-d0e45.firebasestorage.app",
  messagingSenderId: "117217514082",
  appId: "1:117217514082:web:b63729eaeb8df0b138f73b",
  measurementId: "G-P0X09B0YLP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;