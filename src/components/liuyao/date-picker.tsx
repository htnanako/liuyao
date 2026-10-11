import { useEffect, useId, useRef, useState } from "react";
import { formatChineseDate, localISODate } from "@/lib/liuyao/calendar";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

type Props = {
  id?: string;
  /** YYYY-MM-DD，可以为空。 */
  value: string;
  onChange: (iso: string) => void;
};

type YearMonth = { y: number; m: number };

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthOf(iso: string): YearMonth {
  const parsed = parseISO(iso);
  if (parsed) return { y: parsed.y, m: parsed.m };
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() };
}

function CalendarGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="12" />
      <path d="M1.5 6.5h13M5 1v3M11 1v3" />
    </svg>
  );
}

export function DatePicker({ id, value, onChange }: Props) {
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<YearMonth>(() => monthOf(value));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openPanel = () => {
    setView(monthOf(value));
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const total = view.y * 12 + view.m + delta;
    setView({ y: Math.floor(total / 12), m: total % 12 });
  };

  const choose = (iso: string) => {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<number | null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = localISODate();

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="flex h-11 min-w-44 items-center justify-between gap-3 border border-line bg-paper px-3 text-left text-ink"
      >
        <span>{value ? formatChineseDate(value) : "选择日期"}</span>
        <span className="text-bronze-deep">
          <CalendarGlyph />
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="选择占日"
          className="absolute left-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] border border-line bg-paper p-4 shadow-[0_8px_24px_rgba(26,23,20,0.12)]"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="上个月"
              className="h-9 w-9 border border-line text-ink"
            >
              ‹
            </button>
            <div className="text-base font-semibold tracking-wide" aria-live="polite">
              {view.y}年{view.m + 1}月
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="下个月"
              className="h-9 w-9 border border-line text-ink"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center text-xs text-muted">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {cells.map((day, index) => {
              if (day === null) return <div key={`blank-${index}`} />;
              const iso = toISO(view.y, view.m, day);
              const selected = iso === value;
              const isToday = iso === today;
              const classes = [
                "h-9 border",
                selected
                  ? "border-cinnabar bg-cinnabar text-on-cinnabar"
                  : isToday
                    ? "border-bronze text-bronze-deep"
                    : "border-transparent text-ink hover:border-line",
              ].join(" ");
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => choose(iso)}
                  aria-label={formatChineseDate(iso)}
                  aria-pressed={selected}
                  aria-current={isToday ? "date" : undefined}
                  className={classes}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            <button type="button" onClick={() => choose(today)} className="text-cinnabar">
              今日
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="text-muted"
            >
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
