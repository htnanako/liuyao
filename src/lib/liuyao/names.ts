export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export type Element = "金" | "木" | "水" | "火" | "土";
export type Relation = "父母" | "兄弟" | "子孙" | "妻财" | "官鬼";
export type Spirit = "青龙" | "朱雀" | "勾陈" | "螣蛇" | "白虎" | "玄武";
export type Season = "旺" | "相" | "休" | "囚" | "死";
export type YaoValue = 6 | 7 | 8 | 9;

export const BRANCH_ELEMENT: Record<string, Element> = {
  子: "水",
  亥: "水",
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  申: "金",
  酉: "金",
  丑: "土",
  辰: "土",
  未: "土",
  戌: "土",
};

export const CLASH: Record<string, string> = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳",
};

/** 进神：同五行顺进。退神为其逆。 */
export const ADVANCE: Record<string, string> = {
  寅: "卯",
  巳: "午",
  申: "酉",
  亥: "子",
  丑: "辰",
  辰: "未",
  未: "戌",
  戌: "丑",
};

const GENERATES: Record<Element, Element> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const CONTROLS: Record<Element, Element> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

export function generates(from: Element, to: Element): boolean {
  return GENERATES[from] === to;
}

export function controls(from: Element, to: Element): boolean {
  return CONTROLS[from] === to;
}

/** 生我父母，我生子孙，克我官鬼，我克妻财，比和兄弟。 */
export function relationOf(line: Element, palace: Element): Relation {
  if (line === palace) return "兄弟";
  if (generates(line, palace)) return "父母";
  if (generates(palace, line)) return "子孙";
  if (controls(line, palace)) return "官鬼";
  return "妻财";
}

/** 月令旺相休囚死。 */
export function seasonOf(month: string, element: Element): Season {
  const wood: Record<Element, Season> = { 木: "旺", 火: "相", 水: "休", 金: "囚", 土: "死" };
  const fire: Record<Element, Season> = { 火: "旺", 土: "相", 木: "休", 水: "囚", 金: "死" };
  const metal: Record<Element, Season> = { 金: "旺", 水: "相", 土: "休", 火: "囚", 木: "死" };
  const water: Record<Element, Season> = { 水: "旺", 木: "相", 金: "休", 土: "囚", 火: "死" };
  const earth: Record<Element, Season> = { 土: "旺", 金: "相", 火: "休", 木: "囚", 水: "死" };
  const table: Record<string, Record<Element, Season>> = {
    寅: wood,
    卯: wood,
    巳: fire,
    午: fire,
    申: metal,
    酉: metal,
    亥: water,
    子: water,
    辰: earth,
    戌: earth,
    丑: earth,
    未: earth,
  };
  return table[month][element];
}

export const SPIRITS: Spirit[] = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];

/** 六神随日干，自初爻起。 */
export function spiritAt(dayStem: string, lineIndex: number): Spirit {
  const start: Record<string, number> = {
    甲: 0,
    乙: 0,
    丙: 1,
    丁: 1,
    戊: 2,
    己: 3,
    庚: 4,
    辛: 4,
    壬: 5,
    癸: 5,
  };
  return SPIRITS[(start[dayStem] + lineIndex) % 6];
}

export const LINE_POS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

export function classicalLineName(index: number, yin: boolean): string {
  const num = yin ? "六" : "九";
  if (index === 0) return `初${num}`;
  if (index === 5) return `上${num}`;
  const mid = ["二", "三", "四", "五"][index - 1];
  return `${num}${mid}`;
}

export const YAO_LABEL: Record<YaoValue, { name: string; alias: string }> = {
  6: { name: "老阴", alias: "交" },
  7: { name: "少阳", alias: "单" },
  8: { name: "少阴", alias: "拆" },
  9: { name: "老阳", alias: "重" },
};

export function isYinValue(value: YaoValue): boolean {
  return value === 6 || value === 8;
}

export function isMovingValue(value: YaoValue): boolean {
  return value === 6 || value === 9;
}

/** 老阴变阳，老阳变阴。 */
export function changedIsYang(value: YaoValue): boolean {
  if (value === 6) return true;
  if (value === 9) return false;
  return value === 7;
}
