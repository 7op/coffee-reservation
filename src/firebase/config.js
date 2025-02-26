import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "xxx-xxx-xxx",
  authDomain: "coffee-reservation-xxx.firebaseapp.com",
  projectId: "coffee-reservation-xxx",
  storageBucket: "coffee-reservation-xxx.appspot.com",
  messagingSenderId: "xxxxxxxxxx",
  appId: "1:xxxxxxxxxx:web:xxxxxxxxxxxxxxxx"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير قاعدة البيانات
export const db = getFirestore(app); 