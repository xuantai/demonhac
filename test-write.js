import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcml_QfgGTH80OKmRVj2tWIomEQUUiHB0",
  authDomain: "taimusic-96289.firebaseapp.com",
  projectId: "taimusic-96289",
  storageBucket: "taimusic-96289.firebasestorage.app",
  messagingSenderId: "848155741386",
  appId: "1:848155741386:web:4f5b5d826ce5fbbba8f833",
  measurementId: "G-D4ZSK50GZ2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");
const docRef = doc(db, 'app_data', 'main');

setDoc(docRef, { initialized: true }, { merge: true }).then(() => {
  console.log("Write success!");
  process.exit(0);
}).catch(err => {
  console.error("Write Error:", err);
  process.exit(1);
});
