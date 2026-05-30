/**
 * Sprint Manager — Obsidian Plugin
 * Direct copy of apps/word-addin/src/lib/sprintManager.ts.
 */

import { db } from "../config/firebase";
import { SprintModel, User } from "@writinghabit/models";
import {
  getSprint as getSprintUtil,
  getCompletedSprints as getCompletedSprintsUtil,
  createSprint as createSprintUtil,
  updateSprint as updateSprintUtil,
  deleteSprint as deleteSprintUtil,
  joinSprint as joinSprintUtil,
  leaveSprint as leaveSprintUtil,
  getSprintsSinceDate as getSprintsSinceDateUtil,
} from "@writinghabit/utils";

export async function getSprint(code: string) {
  return getSprintUtil(db, code);
}

export async function getCompletedSprints() {
  return getCompletedSprintsUtil(db);
}

export async function createSprint(sprint: any) {
  return createSprintUtil(db, sprint);
}

export async function updateSprint(id: string, data: any) {
  return updateSprintUtil(db, id, data);
}

export async function deleteSprint(id: string) {
  return deleteSprintUtil(db, id);
}

export async function joinSprint(code: string, user: User) {
  return joinSprintUtil(db, code, user);
}

export async function leaveSprint(sprint: SprintModel, user: User) {
  return leaveSprintUtil(db, sprint, user);
}

export async function getSprintsSinceDate(userId: string, date: Date) {
  return getSprintsSinceDateUtil(db, userId, date);
}
