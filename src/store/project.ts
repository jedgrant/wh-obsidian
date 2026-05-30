/**
 * Project store — Obsidian Plugin
 *
 * Direct mirror of apps/word-addin/src/store/project.ts.
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Project } from "@writinghabit/models";

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const ref = doc(db, `projects/${projectId}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Project;
  } catch (err) {
    console.error("[project store] getProject failed:", err);
    return null;
  }
}

export async function createProject(
  projectId: string,
  data: Partial<Project>
): Promise<void> {
  const ref = doc(db, `projects/${projectId}`);
  await setDoc(
    ref,
    { ...data, id: projectId, lastUpdated: serverTimestamp() },
    { merge: true }
  );
}

export async function updateProject(
  projectId: string,
  data: Partial<Project>
): Promise<void> {
  try {
    const ref = doc(db, `projects/${projectId}`);
    await updateDoc(ref, { ...data, lastUpdated: serverTimestamp() });
  } catch (err) {
    console.error("[project store] updateProject failed:", err);
  }
}
