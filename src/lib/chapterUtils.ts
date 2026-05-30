/**
 * chapterUtils for Word Add-in
 * Direct port from chrome-ext — no chrome deps.
 * In word-addin, chapterId == projectId (single document per project).
 */

export interface ChapterStats {
  words: number;
  minutes: number;
  wpm: number;
}

export function getChapterStats(
  chapterWords: { [chapterId: string]: number } | undefined,
  chapterMinutes: { [chapterId: string]: number } | undefined,
  chapterId: string
): ChapterStats {
  const words = chapterWords?.[chapterId] ?? 0;
  const minutes = chapterMinutes?.[chapterId] ?? 0;
  const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
  return { words, minutes, wpm };
}
