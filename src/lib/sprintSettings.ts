/**
 * Sprint Settings Manager for Obsidian Plugin
 */

import { loadPluginDataKey, savePluginDataKey } from "./pluginData";

export interface SprintSettings {
  duration: number;
  goal: number;
  monsterBattle: boolean;
  publicSprint: boolean;
  winCondition: "time" | "words" | "either";
}

const DEFAULT_SPRINT_SETTINGS: SprintSettings = {
  duration: 15,
  goal: 500,
  monsterBattle: true,
  publicSprint: false,
  winCondition: "either",
};

const STORAGE_KEY = "sprintSettings";

export async function getSprintSettings(): Promise<SprintSettings> {
  const saved = await loadPluginDataKey<Partial<SprintSettings>>(STORAGE_KEY, {});
  return { ...DEFAULT_SPRINT_SETTINGS, ...saved };
}

export async function saveSprintSettings(settings: Partial<SprintSettings>): Promise<void> {
  const current = await getSprintSettings();
  await savePluginDataKey(STORAGE_KEY, { ...current, ...settings });
}

export async function resetSprintSettings(): Promise<void> {
  await saveSprintSettings(DEFAULT_SPRINT_SETTINGS);
}
