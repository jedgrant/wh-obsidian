/**
 * pluginData — Obsidian Plugin Data Store
 *
 * Wraps Obsidian's plugin.loadData() / plugin.saveData() so any module can
 * read and write persistent plugin settings without touching localStorage.
 *
 * Call initPluginData(plugin) once in Plugin.onload() before anything else.
 */
import type { Plugin } from "obsidian";

let _plugin: Plugin | null = null;

export function initPluginData(plugin: Plugin): void {
  _plugin = plugin;
}

type DataStore = Record<string, unknown>;

async function load(): Promise<DataStore> {
  if (_plugin) {
    return ((await _plugin.loadData()) as DataStore | null) ?? {};
  }
  return {};
}

export async function loadPluginDataKey<T>(key: string, defaultValue: T): Promise<T> {
  const data = await load();
  return key in data ? (data[key] as T) : defaultValue;
}

export async function savePluginDataKey(key: string, value: unknown): Promise<void> {
  if (!_plugin) return;
  const data = await load();
  data[key] = value;
  await _plugin.saveData(data);
}

export async function deletePluginDataKey(key: string): Promise<void> {
  if (!_plugin) return;
  const data = await load();
  delete data[key];
  await _plugin.saveData(data);
}
