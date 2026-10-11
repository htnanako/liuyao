import { dayPillar, formatChineseDate, kongBranches, monthBranch } from "./calendar";
import { HEX_BY_BITS, type HexRecord } from "./hexes";
import {
  ADVANCE,
  BRANCH_ELEMENT,
  CLASH,
  LINE_POS,
  YAO_LABEL,
  type Element,
  type Relation,
  type Season,
  type Spirit,
  type YaoValue,
  changedIsYang,
  classicalLineName,
  controls,
  generates,
  isMovingValue,
  isYinValue,
  relationOf,
  seasonOf,
  spiritAt,
} from "./names";

export type CategoryId =
  | "general"
  | "wealth"
  | "love"
  | "career"
  | "exam"
  | "health"
  | "travel"
  | "lost"
  | "lawsuit"
  | "child"
  | "home";

export type Gender = "male" | "female" | "unset";

export const CATEGORIES: { id: CategoryId; label: string; hint: string }[] = [
  { id: "general", label: "综合", hint: "以世爻为自己" },
  { id: "wealth", label: "求财", hint: "以妻财为用神" },
  { id: "love", label: "婚恋", hint: "男以财为妻，女以官为夫" },
  { id: "career", label: "仕途", hint: "以官鬼为用神" },
  { id: "exam", label: "考试", hint: "以父母为文书" },
  { id: "health", label: "疾病", hint: "官鬼为病象，子孙为药象" },
  { id: "travel", label: "出行", hint: "以世爻为行人" },
  { id: "lost", label: "失物", hint: "以妻财为所失之物" },
  { id: "lawsuit", label: "官非", hint: "以官鬼为官非之象" },
  { id: "child", label: "子嗣", hint: "以子孙为用神" },
  { id: "home", label: "家宅", hint: "以父母为家宅" },
];

export type CoinFace = "zi" | "bei";

/** 字为阴，记二；背为阳，记三。背数 0–3 即老阴至老阳。 */
export function castOnce(): { value: YaoValue; coins: [CoinFace, CoinFace, CoinFace] } {
  const coins = [0, 1, 2].map(() => (Math.random() < 0.5 ? "zi" : "bei")) as [
    CoinFace,
    CoinFace,
    CoinFace,
  ];
  const backs = coins.filter((face) => face === "bei").length;
  return { value: (6 + backs) as YaoValue, coins };
}

export function coinPhrase(coins: CoinFace[]): string {
  const backs = coins.filter((face) => face === "bei").length;
  const words = ["三个字", "两字一背", "两背一字", "三个背"];
  return words[backs];
}

const TRIGRAMS: Record<string, { name: string; nature: string; element: Element }> = {
  "111": { name: "乾", nature: "天", element: "金" },
  "110": { name: "兑", nature: "泽", element: "金" },
  "101": { name: "离", nature: "火", element: "火" },
  "100": { name: "震", nature: "雷", element: "木" },
  "011": { name: "巽", nature: "风", element: "木" },
  "010": { name: "坎", nature: "水", element: "水" },
  "001": { name: "艮", nature: "山", element: "土" },
  "000": { name: "坤", nature: "地", element: "土" },
};

const PURE_TITLE: Record<string, string> = {
  乾: "乾为天",
  坤: "坤为地",
  坎: "坎为水",
  离: "离为火",
  震: "震为雷",
  艮: "艮为山",
  巽: "巽为风",
  兑: "兑为泽",
};

/** 纳甲：内卦初至三，外卦四至上。干支连写。 */
const NAJIA: Record<string, { inner: [string, string, string]; outer: [string, string, string] }> = {
  乾: { inner: ["甲子", "甲寅", "甲辰"], outer: ["壬午", "壬申", "壬戌"] },
  坤: { inner: ["乙未", "乙巳", "乙卯"], outer: ["癸丑", "癸亥", "癸酉"] },
  震: { inner: ["庚子", "庚寅", "庚辰"], outer: ["庚午", "庚申", "庚戌"] },
  巽: { inner: ["辛丑", "辛亥", "辛酉"], outer: ["辛未", "辛巳", "辛卯"] },
  坎: { inner: ["戊寅", "戊辰", "戊午"], outer: ["戊申", "戊戌", "戊子"] },
  离: { inner: ["己卯", "己丑", "己亥"], outer: ["己酉", "己未", "己巳"] },
  艮: { inner: ["丙辰", "丙午", "丙申"], outer: ["丙戌", "丙子", "丙寅"] },
  兑: { inner: ["丁巳", "丁卯", "丁丑"], outer: ["丁亥", "丁酉", "丁未"] },
};

const PALACE_ORDER = ["乾", "坎", "艮", "震", "巽", "离", "坤", "兑"] as const;
const GEN_LABEL = ["本宫", "一世", "二世", "三世", "四世", "五世", "游魂", "归魂"] as const;
const SHI_POS = [5, 0, 1, 2, 3, 4, 3, 2];

type PalaceInfo = {
  palace: string;
  element: Element;
  generation: (typeof GEN_LABEL)[number];
  shi: number;
};

function triKey(bits: boolean[]): string {
  return bits.map((yang) => (yang ? "1" : "0")).join("");
}

function trigramOf(bits: boolean[]) {
  return TRIGRAMS[triKey(bits)];
}

export type NajiaCell = { stem: string; branch: string; element: Element };

function najiaOf(bits: boolean[]): NajiaCell[] {
  const lower = trigramOf(bits.slice(0, 3)).name;
  const upper = trigramOf(bits.slice(3)).name;
  return [...NAJIA[lower].inner, ...NAJIA[upper].outer].map((ganzhi) => {
    const stem = ganzhi.slice(0, 1);
    const branch = ganzhi.slice(1);
    return { stem, branch, element: BRANCH_ELEMENT[branch] };
  });
}

function buildPalaces(): Map<string, PalaceInfo> {
  const map = new Map<string, PalaceInfo>();
  for (const palace of PALACE_ORDER) {
    const key = Object.entries(TRIGRAMS).find(([, info]) => info.name === palace)?.[0];
    if (!key) throw new Error(palace);
    const base = (key + key).split("").map((ch) => ch === "1");
    const lines = base.slice();
    const record = (generation: number) => {
      const bits = lines.map((yang) => (yang ? "1" : "0")).join("");
      map.set(bits, {
        palace,
        element: TRIGRAMS[key].element,
        generation: GEN_LABEL[generation],
        shi: SHI_POS[generation],
      });
    };
    record(0);
    for (let i = 0; i < 5; i += 1) {
      lines[i] = !lines[i];
      record(i + 1);
    }
    lines[3] = !lines[3];
    record(6);
    lines[0] = base[0];
    lines[1] = base[1];
    lines[2] = base[2];
    record(7);
  }
  return map;
}

const PALACES = buildPalaces();

export type InstalledHex = {
  bits: string;
  record: HexRecord;
  fullName: string;
  unicode: string;
  upper: string;
  lower: string;
  palace: string;
  palaceElement: Element;
  generation: string;
  shi: number;
  ying: number;
  najia: NajiaCell[];
};

export function installHex(bits: string): InstalledHex {
  const record = HEX_BY_BITS[bits];
  const palace = PALACES.get(bits);
  if (!record || !palace) throw new Error(`未知卦 ${bits}`);
  const flags = bits.split("").map((ch) => ch === "1");
  const lower = trigramOf(flags.slice(0, 3));
  const upper = trigramOf(flags.slice(3));
  const fullName =
    upper.name === lower.name
      ? (PURE_TITLE[record.name] ?? `${upper.nature}${lower.nature}${record.name}`)
      : `${upper.nature}${lower.nature}${record.name}`;
  return {
    bits,
    record,
    fullName,
    unicode: String.fromCodePoint(0x4dc0 + record.kingWen - 1),
    upper: upper.name,
    lower: lower.name,
    palace: palace.palace,
    palaceElement: palace.element,
    generation: palace.generation,
    shi: palace.shi,
    ying: (palace.shi + 3) % 6,
    najia: najiaOf(flags),
  };
}

function pureBits(palace: string): boolean[] {
  const key = Object.entries(TRIGRAMS).find(([, info]) => info.name === palace)?.[0];
  if (!key) throw new Error(palace);
  return (key + key).split("").map((ch) => ch === "1");
}

function changeTags(from: NajiaCell, to: NajiaCell): string[] {
  const tags: string[] = [];
  if (generates(to.element, from.element)) tags.push("回头生");
  else if (controls(to.element, from.element)) tags.push("回头克");
  else if (generates(from.element, to.element)) tags.push("化泄");
  else if (controls(from.element, to.element)) tags.push("化克");
  if (ADVANCE[from.branch] === to.branch) tags.push("进神");
  if (ADVANCE[to.branch] === from.branch) tags.push("退神");
  if (CLASH[from.branch] === to.branch) tags.push("化冲");
  if (from.branch === to.branch) tags.push("伏吟");
  return tags;
}

export type ChangedYao = NajiaCell & { relation: Relation; yang: boolean; tags: string[] };

export type PlateLine = {
  index: number;
  value: YaoValue;
  yang: boolean;
  moving: boolean;
  stem: string;
  branch: string;
  element: Element;
  relation: Relation;
  spirit: Spirit;
  shi: boolean;
  ying: boolean;
  season: Season;
  kong: boolean;
  monthBreak: boolean;
  dayClash: boolean;
  hiddenMove: boolean;
  dayLink: boolean;
  monthLink: boolean;
  marks: string[];
  changed: ChangedYao | null;
  fu: (NajiaCell & { relation: Relation }) | null;
};

export type Plate = {
  question: string;
  category: CategoryId;
  categoryLabel: string;
  gender: Gender;
  date: string;
  dateLabel: string;
  dayStem: string;
  dayBranch: string;
  dayLabel: string;
  kong: [string, string];
  monthBranch: string;
  monthElement: Element;
  spiritRule: string;
  original: InstalledHex;
  changed: InstalledHex | null;
  lines: PlateLine[];
  movingIndexes: number[];
  fanYin: boolean;
  fuYin: boolean;
  notes: string[];
  yongLabel: string;
};

export type ReadingInput = {
  question: string;
  category: CategoryId;
  gender: Gender;
  date: string;
  lines: YaoValue[];
};

function bitsFromLines(lines: YaoValue[], changed: boolean): string {
  return lines
    .map((value) => {
      const yang = changed ? changedIsYang(value) : !isYinValue(value);
      return yang ? "1" : "0";
    })
    .join("");
}

function yongRelations(category: CategoryId, gender: Gender): Relation[] {
  switch (category) {
    case "wealth":
    case "lost":
      return ["妻财"];
    case "career":
    case "lawsuit":
      return ["官鬼"];
    case "exam":
    case "home":
      return ["父母"];
    case "health":
      return ["官鬼"];
    case "child":
      return ["子孙"];
    case "love":
      if (gender === "male") return ["妻财"];
      if (gender === "female") return ["官鬼"];
      return ["妻财", "官鬼"];
    default:
      return [];
  }
}

function describeLine(line: PlateLine): string {
  return `${LINE_POS[line.index]}${line.relation}${line.branch}${line.element}`;
}

function whereRelation(lines: PlateLine[], relation: Relation): string[] {
  const found: string[] = [];
  for (const line of lines) {
    if (line.relation === relation) {
      const extra = line.marks.length ? `（${line.marks.join("、")}）` : "";
      found.push(`${LINE_POS[line.index]}${extra}`);
    }
    if (line.changed?.relation === relation) {
      found.push(`${LINE_POS[line.index]}变出`);
    }
  }
  return found;
}

function buildNotes(input: {
  lines: PlateLine[];
  original: InstalledHex;
  changed: InstalledHex | null;
  dayLabel: string;
  kong: [string, string];
  monthBranch: string;
  monthElement: Element;
  category: CategoryId;
  gender: Gender;
  fanYin: boolean;
  fuYin: boolean;
}): string[] {
  const { lines, original, changed } = input;
  const notes: string[] = [];
  notes.push(
    `占日${input.dayLabel}，旬空${input.kong.join("")}。月建${input.monthBranch}，${input.monthElement}旺。`,
  );
  notes.push(
    `${original.fullName}，${original.palace}宫${original.generation}。世在${LINE_POS[original.shi]}，应在${LINE_POS[original.ying]}。`,
  );

  const moving = lines.filter((line) => line.moving);
  if (moving.length === 0) {
    notes.push("六爻皆静，不成立变卦。安静之卦，看本卦卦辞，以及世爻与日月的关系。");
  } else {
    const parts = moving.map((line) => {
      let text = describeLine(line);
      if (line.changed) {
        text += `，化${line.changed.relation}${line.changed.branch}${line.changed.element}`;
        if (line.changed.tags.length) text += `（${line.changed.tags.join("、")}）`;
      }
      return text;
    });
    notes.push(`动爻：${parts.join("；")}。`);
    if (changed) notes.push(`之卦${changed.fullName}，${changed.palace}宫${changed.generation}。`);
  }
  if (input.fanYin) notes.push("本卦与之卦爻支全相冲，为反吟。");
  if (input.fuYin) notes.push("本卦与之卦爻支全同，为伏吟。");

  const shi = lines[original.shi];
  const shiMarks = shi.marks.length ? `，${shi.marks.join("、")}` : "";
  notes.push(`世爻${shi.relation}${shi.branch}${shi.element}，月令${shi.season}${shiMarks}。`);

  const relations = yongRelations(input.category, input.gender);
  if (relations.length === 0) {
    if (input.category === "travel") {
      notes.push("出行以世爻为行人。父母为舟车道路，妻财为资斧，官鬼为阻。");
    } else {
      notes.push("综合之占以世爻为问卦之人，应以对方、他处。世生应则我去就他，应生世则他来就我。");
    }
  }

  for (const relation of relations) {
    const spots = whereRelation(lines, relation);
    const fu = lines.find((line) => line.fu?.relation === relation);
    if (spots.length === 0) {
      notes.push(
        fu
          ? `用神${relation}不现于飞神，伏于${LINE_POS[fu.index]}之下：${fu.fu?.relation}${fu.fu?.branch}${fu.fu?.element}。飞神为${fu.relation}${fu.branch}${fu.element}。`
          : `用神${relation}不现。`,
      );
    } else {
      notes.push(`用神${relation}见于${spots.join("、")}。`);
    }
  }

  if (input.category === "health") {
    notes.push("疾病一类，传统以官鬼为病象、子孙为药象。这里只标爻位，不断病症。");
  }
  if (input.category === "exam") {
    notes.push("考试以父母为文书。官鬼为功名，可对照，不另立一断。");
  }
  if (input.category === "lawsuit") {
    notes.push("官非以官鬼为讼象，子孙为解忧之神。此为爻位对照，不是法律意见。");
  }
  if (input.category === "love" && input.gender === "unset") {
    notes.push("未分问卦者男女，故妻财与官鬼并陈。");
  }
  return notes;
}

export function buildPlate(input: ReadingInput): Plate {
  if (input.lines.length !== 6) throw new Error("需要六爻");
  const values = input.lines as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];
  const original = installHex(bitsFromLines(values, false));
  const movingIndexes = values.map((value, index) => (isMovingValue(value) ? index : -1)).filter((i) => i >= 0);
  const changed = movingIndexes.length ? installHex(bitsFromLines(values, true)) : null;
  const day = dayPillar(input.date);
  const kong = kongBranches(day.stem, day.branch);
  const month = monthBranch(input.date);
  const monthElement = BRANCH_ELEMENT[month];
  const palaceBits = pureBits(original.palace);
  const palaceNajia = najiaOf(palaceBits);

  const lines: PlateLine[] = values.map((value, index) => {
    const cell = original.najia[index];
    const relation = relationOf(cell.element, original.palaceElement);
    const moving = isMovingValue(value);
    const kongwang = kong.includes(cell.branch);
    const monthBreak = CLASH[cell.branch] === month;
    const dayClash = CLASH[cell.branch] === day.branch;
    const season = seasonOf(month, cell.element);
    const hiddenMove = !moving && dayClash && (season === "旺" || season === "相");
    const dayLink = cell.branch === day.branch;
    const monthLink = cell.branch === month;
    const marks: string[] = [];
    if (dayLink) marks.push("临日");
    if (monthLink) marks.push("临月");
    if (kongwang) marks.push(moving ? "出空" : monthLink ? "填实" : "旬空");
    if (monthBreak) marks.push("月破");
    if (hiddenMove) marks.push("暗动");
    else if (!moving && dayClash) marks.push("日破");

    let changedCell: ChangedYao | null = null;
    if (moving && changed) {
      const next = changed.najia[index];
      changedCell = {
        ...next,
        relation: relationOf(next.element, original.palaceElement),
        yang: changedIsYang(value),
        tags: changeTags(cell, next),
      };
    }

    const hiddenRelation = relationOf(palaceNajia[index].element, original.palaceElement);
    const fu =
      hiddenRelation === relation
        ? null
        : { ...palaceNajia[index], relation: hiddenRelation };

    return {
      index,
      value,
      yang: !isYinValue(value),
      moving,
      stem: cell.stem,
      branch: cell.branch,
      element: cell.element,
      relation,
      spirit: spiritAt(day.stem, index),
      shi: index === original.shi,
      ying: index === original.ying,
      season,
      kong: kongwang,
      monthBreak,
      dayClash,
      hiddenMove,
      dayLink,
      monthLink,
      marks,
      changed: changedCell,
      fu,
    };
  });

  const visibleFu = new Set(yongRelations(input.category, input.gender));
  for (const line of lines) {
    if (!line.fu || !visibleFu.has(line.fu.relation)) line.fu = null;
    else if (
      lines.some((other) => other.relation === line.fu?.relation || other.changed?.relation === line.fu?.relation)
    ) {
      line.fu = null;
    }
  }

  const fanYin = Boolean(
    changed && original.najia.every((cell, index) => CLASH[cell.branch] === changed.najia[index].branch),
  );
  const fuYin = Boolean(
    changed && original.najia.every((cell, index) => cell.branch === changed.najia[index].branch),
  );

  const category = CATEGORIES.find((item) => item.id === input.category) ?? CATEGORIES[0];
  const relations = yongRelations(input.category, input.gender);
  const yongLabel =
    relations.length === 0
      ? input.category === "travel"
        ? "用神 · 世爻"
        : "用神 · 世爻"
      : `用神 · ${relations.join("、")}`;

  const spiritStart = lines[0]?.spirit ?? "青龙";
  return {
    question: input.question.trim(),
    category: category.id,
    categoryLabel: category.label,
    gender: input.gender,
    date: input.date,
    dateLabel: formatChineseDate(input.date),
    dayStem: day.stem,
    dayBranch: day.branch,
    dayLabel: `${day.stem}${day.branch}`,
    kong,
    monthBranch: month,
    monthElement,
    spiritRule: `${day.stem}日起${spiritStart}`,
    original,
    changed,
    lines,
    movingIndexes,
    fanYin,
    fuYin,
    yongLabel,
    notes: buildNotes({
      lines,
      original,
      changed,
      dayLabel: `${day.stem}${day.branch}`,
      kong,
      monthBranch: month,
      monthElement,
      category: input.category,
      gender: input.gender,
      fanYin,
      fuYin,
    }),
  };
}

export function yaoMark(value: YaoValue): string {
  if (value === 9) return "○";
  if (value === 6) return "×";
  return "";
}

export { classicalLineName, LINE_POS, YAO_LABEL };
