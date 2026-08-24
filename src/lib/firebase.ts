import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "igneous-shift-0xctm",
  appId: "1:530843303325:web:1cdc5a9e2449a9dc9e8374",
  apiKey: "AIzaSyC2bwhOCt82AhLNulLKL5jKLpH4dvaO9_U",
  authDomain: "igneous-shift-0xctm.firebaseapp.com",
  storageBucket: "igneous-shift-0xctm.firebasestorage.app",
  messagingSenderId: "530843303325",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-52549ce4-1c2d-4452-afd5-fac2be5d6754");

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Google sign in popup error or blocked by iframe:", error);
    // Let the caller handle popup restrictions if the iframe blocks the sign-in window
    throw error;
  }
}

export async function loginWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

export async function finishGoogleRedirect(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user || null;
}

export async function logoutUser() {
  return signOut(auth);
}
