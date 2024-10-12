// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCTiv0L_KrFgejo5vUM3jQkTFCltuJjWYM",
    authDomain: "techchallenge-1ef83.firebaseapp.com",
    projectId: "techchallenge-1ef83",
    storageBucket: "techchallenge-1ef83.appspot.com",
    messagingSenderId: "636793795279",
    appId: "1:636793795279:web:a46a008424edcb9c1bbdba",
    measurementId: "G-FH4WHG23G0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Funcția pentru autentificare
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user; // Returnează informațiile userului
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Funcția pentru deconectare
const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export { signInWithGoogle, signOutUser, auth };
