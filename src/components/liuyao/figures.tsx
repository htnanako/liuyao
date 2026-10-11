import type { YaoValue } from "@/lib/liuyao/names";
import { yaoMark } from "@/lib/liuyao/engine";

export function YaoBar({
  yang,
  moving,
  width = "wide",
}: {
  yang: boolean;
  moving: boolean;
  width?: "wide" | "narrow";
}) {
  const color = moving ? "bg-cinnabar" : "bg-ink";
  const bar = width === "wide" ? "w-24" : "w-16";
  if (yang) {
    return <span className={`block h-2 ${bar} ${color}`} />;
  }
  return (
    <span className={`flex ${bar} gap-2`}>
      <span className={`h-2 flex-1 ${color}`} />
      <span className={`h-2 flex-1 ${color}`} />
    </span>
  );
}

export function GhostBar() {
  return <span className="block h-2 w-16 bg-line" />;
}

const POS = ["初", "二", "三", "四", "五", "上"];

export function HexStack({
  rows,
}: {
  rows: { yang: boolean; moving: boolean; value?: YaoValue; pending?: boolean }[];
}) {
  const ordered = [...rows].reverse();
  return (
    <div className="flex flex-col gap-2.5">
      {ordered.map((row, display) => {
        const index = rows.length - 1 - display;
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="w-4 text-sm text-muted">{POS[index]}</span>
            {row.pending ? <GhostBar /> : <YaoBar yang={row.yang} moving={row.moving} width="narrow" />}
            <span className="w-4 text-center text-sm text-cinnabar">
              {row.value ? yaoMark(row.value) : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
