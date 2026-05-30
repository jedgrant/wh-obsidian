/**
 * User utilities — Obsidian Plugin
 * Direct copy of apps/word-addin/src/lib/users.ts.
 */

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { User } from "@writinghabit/models";

export const getUserByUserName = async (userName: string): Promise<User | null> => {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("userName", "==", userName),
      limit(1)
    );
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { ...d.data(), id: d.id } as User;
  } catch (err) {
    console.error("Error fetching user by username:", err);
    return null;
  }
};

export const updateUserProp = async (
  userId: string,
  data: Record<string, unknown>
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};

export const getUsers = async (
  userNames: string[],
  field: string = "userName"
): Promise<User[]> => {
  if (!userNames || userNames.length === 0) return [];
  try {
    const chunkSize = 10;
    const allUsers: User[] = [];
    for (let i = 0; i < userNames.length; i += chunkSize) {
      const chunk = userNames.slice(i, i + chunkSize);
      const usersQuery = query(
        collection(db, "users"),
        where(field, "in", chunk)
      );
      const snapshot = await getDocs(usersQuery);
      snapshot.docs.forEach((d) => allUsers.push({ ...d.data(), id: d.id } as User));
    }
    return allUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};
