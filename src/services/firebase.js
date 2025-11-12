import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// REEMPLAZA CON TUS CREDENCIALES DE FIREBASE
// Las mismas que usaste en la app móvil
const firebaseConfig = {
  apiKey: "AIzaSyD_l_MoWMWAlvZ7Ii5X6xQ7u5B1QSQP7JE",
  authDomain: "controldocente-ucayali.firebaseapp.com",
  projectId: "controldocente-ucayali",
  storageBucket: "controldocente-ucayali.firebasestorage.app",
  messagingSenderId: "473371376682",
  appId: "1:473371376682:web:f0766027414b27aed05753"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
