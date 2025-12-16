import { initializeApp, FirebaseApp, getApp, deleteApp } from "firebase/app";
import { getAuth, Auth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Config extracted from the provided google-services.json details
// Note: If these keys are restricted to Android in Google Cloud Console, they won't work on Web/Localhost.
// Use the Setup Screen to override them with Web keys if needed.
const defaultKeys = {
  apiKey: "AIzaSyCgWznEbkgfYE7T09XYV-U4LwaA33Q24Vs",
  authDomain: "tros-one.firebaseapp.com",
  projectId: "tros-one",
  storageBucket: "tros-one.firebasestorage.app",
  messagingSenderId: "125000751012",
  appId: "1:125000751012:android:94b1d3f1f37ad2c661d331" 
};

// 1. Try to get config from Local Storage (User inputted via UI)
const storedConfig = localStorage.getItem('tros_firebase_config');

// 2. Parse config or use default
let firebaseConfig = defaultKeys;
let isConfigured = false;

// If we have the hardcoded key from the file, we consider it configured
// However, we prefer stored config if available
if (defaultKeys.apiKey !== "YOUR_API_KEY_HERE") {
    isConfigured = true;
}

if (storedConfig) {
  try {
    const parsed = JSON.parse(storedConfig);
    if (parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY_HERE") {
      firebaseConfig = parsed;
      isConfigured = true;
    }
  } catch (e) {
    console.error("Failed to parse stored firebase config", e);
  }
} 

// 3. Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// 4. Utility to create a user without logging out the current admin
export const createSystemUser = async (email: string, password: string): Promise<string> => {
  let secondaryApp: FirebaseApp | null = null;
  try {
    // Initialize a secondary app instance to create user without affecting current auth state
    const currentConfig = getApp().options;
    secondaryApp = initializeApp(currentConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    
    // Sign out immediately from the secondary app to be safe
    await signOut(secondaryAuth);
    
    return uid;
  } catch (error) {
    throw error;
  } finally {
    if (secondaryApp) {
      // Clean up the temporary app
      await deleteApp(secondaryApp);
    }
  }
};

export { isConfigured };

// Helper to save config from UI
export const saveFirebaseConfig = (configStr: string) => {
  try {
    // Validate it's JSON
    const config = JSON.parse(configStr);
    if (!config.apiKey) throw new Error("Invalid Config");
    
    localStorage.setItem('tros_firebase_config', JSON.stringify(config));
    window.location.reload(); // Reload to re-initialize firebase
    return true;
  } catch (e) {
    return false;
  }
};

// Helper to clear config
export const resetFirebaseConfig = () => {
  localStorage.removeItem('tros_firebase_config');
  window.location.reload();
};