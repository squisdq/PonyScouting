import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
export * from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Конфиг из Firebase Console → Project settings → Your apps (Web).
// Это публичные идентификаторы, не секрет: доступ защищают правила Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyBfTTjNJ8zbJ6ucxI1y-sQy4K875n-O9NQ",
  authDomain: "ponyscouting.firebaseapp.com",
  projectId: "ponyscouting",
  storageBucket: "ponyscouting.firebasestorage.app",
  messagingSenderId: "973190315453",
  appId: "1:973190315453:web:64f7f27dab002740bca6d4",
};

export const db = getFirestore(initializeApp(firebaseConfig));
