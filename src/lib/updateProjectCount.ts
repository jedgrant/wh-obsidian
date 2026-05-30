/**
 * Update Project Count
 *
 * Counts user's projects using an aggregation query and updates
 * the user document. Called after creating or deleting projects.
 */

import {
  collection,
  query,
  where,
  getCountFromServer,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Count user's projects and update their user document.
 * @param userId - The user's ID
 * @returns The new project count
 */
export async function updateProjectCount(userId: string): Promise<number> {
  try {
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("userId", "==", userId));
    const snapshot = await getCountFromServer(q);
    const projectCount = snapshot.data().count;

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { projectCount });

    return projectCount;
  } catch (err) {
    console.error("[ProjectCount] Failed to update project count:", err);
    throw err;
  }
}
