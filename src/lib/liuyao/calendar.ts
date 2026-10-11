import { BRANCHES, STEMS } from "./names";

/** 二十四节气分钟偏移，0 = 小寒。寿星通书近似，用于定月建。 */
const TERM_MINUTES = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072,
  240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795,
  462224, 483532, 504758,
];

/** 节（非中气）换月建。索引相对小寒。 */
const JIE: { index: number; branch: string }[] = [
  { index: 0, branch: "丑" },
  { index: 2, branch: "寅" },
  { index: 4, branch: "卯" },
  { index: 6, branch: "辰" },
  { index: 8, branch: "巳" },
  { index: 10, branch: "午" },
  { index: 12, branch: "未" },
  { index: 14, branch: "申" },
  { index: 16, branch: "酉" },
  { index: 18, branch: "戌" },
  { index: 20, branch: "亥" },
  { index: 22, branch: "子" },
];

export function localISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatChineseDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

/**
 * 日柱。公历连续纪日，锚点：1900-01-01 = 甲戌（index 10）。
 * 与 2000-01-01 戊午、2024-01-01 甲子相合。
 */
export function dayPillar(isoDate: string): { stem: string; branch: string; index: number } {
  const [y, m, d] = isoDate.split("-").map(Number);
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
  const index = (10 + days) % 60;
  const safe = (index + 60) % 60;
  return { stem: STEMS[safe % 10], branch: BRANCHES[safe % 12], index: safe };
}

/** 甲旬所空的两个地支。 */
export function kongBranches(stem: string, branch: string): [string, string] {
  const si = STEMS.indexOf(stem as (typeof STEMS)[number]);
  const bi = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  const start = (bi - si + 12) % 12;
  return [BRANCHES[(start + 10) % 12], BRANCHES[(start + 11) % 12]];
}

function termShanghaiDate(year: number, index: number): string {
  const ms =
    31556925974.7 * (year - 1900) +
    TERM_MINUTES[index] * 60000 +
    Date.UTC(1900, 0, 6, 2, 5);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
  return parts;
}

/** 月建取节气，不以农历初一换月。节气时刻按北京时间落入的日期。 */
export function monthBranch(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4));
  const marks: { date: string; branch: string }[] = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const jie of JIE) {
      marks.push({ date: termShanghaiDate(y, jie.index), branch: jie.branch });
    }
  }
  marks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let branch = "子";
  for (const mark of marks) {
    if (mark.date <= isoDate) branch = mark.branch;
    else break;
  }
  return branch;
}
