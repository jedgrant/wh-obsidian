/**
 * Firebase Configuration — Obsidian Plugin
 *
 * Mirrors apps/word-addin/src/config/firebase.ts.
 * Environment values are injected by esbuild at build time from .env / .env.local.
 * For local dev, copy apps/web/.env.local here (or symlink it).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

/**
 * Obsidian runs inside Electron under the `app://obsidian.md` origin.
 * If the Firebase API key has HTTP-referrer restrictions set in Google Cloud
 * Console (which is common for web projects), every SDK request is blocked
 * with auth/requests-from-referer-...-are-blocked.
 *
 * Patch window.fetch to send `no-referrer` for all Firebase/Google API calls
 * so those requests arrive without the Obsidian origin in the Referer header.
 */
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const _origFetch = window.fetch.bind(window);
  (window as typeof window).fetch = (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;
    const isFirebaseRequest =
      url.includes("googleapis.com") ||
      url.includes("firebaseapp.com") ||
      url.includes("firebase.io") ||
      url.includes("identitytoolkit") ||
      url.includes("securetoken");
    if (isFirebaseRequest) {
      return _origFetch(input, {
        ...init,
        referrer: "",
        referrerPolicy: "no-referrer",
      });
    }
    return _origFetch(input, init);
  };
}

export const currentEnvironment = process.env.VITE_ENV || "local";
export const isProduction = currentEnvironment === "production";
// Mirror the web app: enable emulators whenever not in production.
// Can also be forced explicitly with VITE_USE_EMULATOR=true in .env.local.
export const useEmulators =
  !isProduction || process.env.VITE_USE_EMULATOR === "true";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Obsidian hot-reloads plugins by evaluating a fresh bundle. Each reload
// creates new Firebase module instances with new class constructors. Reusing
// an old db instance (e.g. via window cache) causes "wrong Firestore class"
// errors because the old instance fails instanceof checks in the new bundle.
//
// Solution: use memoryLocalCache in dev so there is no IndexedDB lock to
// conflict with. In production (no hot-reload), use persistentLocalCache so
// offline writes survive Obsidian restarts.
const existingApp = getApps().find((a) => a.name === "[DEFAULT]");
const app = existingApp ?? initializeApp(firebaseConfig);

export const db = existingApp
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: isProduction
        ? persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
            cacheSizeBytes: 50 * 1024 * 1024,
          })
        : memoryLocalCache(),
    });

export const auth = getAuth(app);
export const functions = getFunctions(app);

if (useEmulators) {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  } catch (error) {
    console.error("[Firebase] Failed to connect to emulators:", error);
  }
}
