import type { CategoryId, Gender } from "./engine";
import type { YaoValue } from "./names";

const KEY = "liuyao.history.v1";

export type SavedReading = {
  id: string;
  at: number;
  question: string;
  category: CategoryId;
  gender: Gender;
  date: string;
  lines: YaoValue[];
};

function isYao(value: unknown): value is YaoValue {
  return value === 6 || value === 7 || value === 8 || value === 9;
}

export function loadHistory(): SavedReading[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedReading => {
      if (!item || typeof item !== "object") return false;
      const row = item as SavedReading;
      return typeof row.id === "string" && Array.isArray(row.lines) && row.lines.length === 6 && row.lines.every(isYao);
    });
  } catch {
    return [];
  }
}

export function saveHistory(items: SavedReading[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 24)));
}
