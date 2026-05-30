/**
 * Authentication helpers — Obsidian Plugin
 *
 * Google sign-in uses the external browser + custom token deep-link flow:
 * the user's default browser opens the auth relay page, completes OAuth,
 * then redirects back via obsidian://writing-habit-auth?token=...
 * No signInWithPopup / GoogleAuthProvider is used, avoiding dynamic
 * GAPI script injection flagged by the Obsidian plugin review.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { User } from "@writinghabit/models";

export { onAuthStateChanged, auth };

// ── Custom token sign-in (Obsidian protocol deep-link flow) ─────────────────

/**
 * Sign into Firebase using a custom token received from the obsidian://
 * deep-link after the user completes OAuth in their external browser.
 */
export async function signInWithToken(
  token: string
): Promise<{ user: FirebaseUser } | { error: string }> {
  try {
    const credential = await signInWithCustomToken(auth, token);
    const firebaseUser = credential.user;

    // Upsert Firestore user doc (may already exist if user signed into web)
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "",
        userName: "",
        appSource: "obsidian-plugin",
        createdAt: serverTimestamp(),
      });
    }
    return { user: firebaseUser };
  } catch (err: unknown) {
    return { error: mapAuthError(err) };
  }
}


// ── Email / Password ────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: FirebaseUser } | { error: string }> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { user: credential.user };
  } catch (err: unknown) {
    return { error: mapAuthError(err) };
  }
}

export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: FirebaseUser } | { error: string }> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    await setDoc(doc(db, "users", firebaseUser.uid), {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: displayName.trim(),
      userName: "",
      appSource: "obsidian-plugin",
      createdAt: serverTimestamp(),
    });

    return { user: firebaseUser };
  } catch (err: unknown) {
    return { error: mapAuthError(err) };
  }
}

export async function sendPasswordReset(
  email: string
): Promise<{ success: true } | { error: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err: unknown) {
    return { error: mapAuthError(err) };
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function getFirestoreUser(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as User;
  } catch {
    return null;
  }
}

// ── Error mapping ───────────────────────────────────────────────────────────

function mapAuthError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    switch ((err as { code: string }).code) {
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed. Please try again.";
      case "auth/cancelled-popup-request":
        return "Sign-in cancelled.";
      case "auth/popup-blocked":
        return "Popup was blocked. Please use email/password sign-in, or allow popups in Obsidian settings.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/requests-from-referer-are-blocked":
        return "Sign-in blocked by API key restrictions. Use email/password, or remove HTTP-referrer restrictions from your Firebase API key in Google Cloud Console.";
      default: {
        const msg = (err as { message?: string }).message ?? "";
        if (msg.includes("referer") || msg.includes("referrer") || msg.includes("blocked")) {
          return "Sign-in blocked by API key restrictions. Please use email/password sign-in instead.";
        }
        return msg || "An error occurred. Please try again.";
      }
    }
  }
  return "An unexpected error occurred. Please try again.";
}
