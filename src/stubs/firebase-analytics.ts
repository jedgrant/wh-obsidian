/**
 * No-op stub for firebase/analytics.
 * Obsidian plugins must not load arbitrary external scripts (e.g. gtag.js),
 * so analytics is disabled entirely in this build target.
 */

export type Analytics = object;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function logEvent(_analytics: Analytics | undefined, ..._args: unknown[]): void {
  // no-op
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAnalytics(..._args: unknown[]): Analytics {
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function initializeAnalytics(..._args: unknown[]): Analytics {
  return {};
}

export function isSupported(): Promise<boolean> {
  return Promise.resolve(false);
}
