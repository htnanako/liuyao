import { useEffect, useRef, useState } from "react";
import { dayPillar, localISODate, monthBranch } from "@/lib/liuyao/calendar";
import {
  CATEGORIES,
  buildPlate,
  castOnce,
  coinPhrase,
  type CategoryId,
  type CoinFace,
  type Gender,
  type Plate,
} from "@/lib/liuyao/engine";
import { loadHistory, saveHistory, type SavedReading } from "@/lib/liuyao/history";
import { BRANCH_ELEMENT, LINE_POS, YAO_LABEL, isYinValue, type YaoValue } from "@/lib/liuyao/names";
import { HexStack } from "./figures";
import { PlateView } from "./plate";

type Phase = "ask" | "cast" | "manual" | "plate";

const YAO_OPTIONS: YaoValue[] = [6, 7, 8, 9];

function motionMs() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 160;
  }
  return 1080;
}

function Coin({ face, spin, delay }: { face: CoinFace; spin: number; delay: string }) {
  const end = face === "bei" ? 180 : 0;
  const deg = spin === 0 ? 0 : spin * 720 + end;
  return (
    <div className="coin-scene" aria-hidden="true">
      <div
        className="coin"
        style={{
          transform: `rotateY(${deg}deg)`,
          transitionDelay: delay,
          transitionDuration: spin === 0 ? "0ms" : undefined,
        }}
      >
        <div className="coin-face">
          <span className="coin-hole" />
          <span className="coin-char coin-n">乾</span>
          <span className="coin-char coin-s">宝</span>
          <span className="coin-char coin-w">通</span>
          <span className="coin-char coin-e">文</span>
        </div>
        <div className="coin-face coin-face-back">
          <span className="coin-hole" />
          <span className="coin-ray coin-ray-n" />
          <span className="coin-ray coin-ray-s" />
          <span className="coin-ray coin-ray-w" />
          <span className="coin-ray coin-ray-e" />
        </div>
      </div>
    </div>
  );
}

function Header({ pillar }: { pillar: string }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center border border-cinnabar text-sm text-cinnabar">
            爻
          </span>
          <p className="text-sm tracking-widest text-muted">纳甲筮法</p>
        </div>
        <h1 className="text-4xl font-semibold tracking-wide">六爻</h1>
      </div>
      <p className="pt-1 text-right text-sm leading-relaxed text-muted">{pillar}</p>
    </header>
  );
}

export function LiuYaoApp() {
  const [date, setDate] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<CategoryId>("general");
  const [gender, setGender] = useState<Gender>("unset");
  const [phase, setPhase] = useState<Phase>("ask");
  const [history, setHistory] = useState<SavedReading[] | null>(null);
  const [lines, setLines] = useState<YaoValue[]>([]);
  const [manual, setManual] = useState<(YaoValue | null)[]>([null, null, null, null, null, null]);
  const [coins, setCoins] = useState<[CoinFace, CoinFace, CoinFace]>(["zi", "zi", "zi"]);
  const [spin, setSpin] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const [last, setLast] = useState<{ value: YaoValue; phrase: string } | null>(null);
  const [auto, setAuto] = useState(false);
  const [active, setActive] = useState<SavedReading | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setDate(localISODate());
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (history) saveHistory(history);
  }, [history]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const pillar = (() => {
    if (!date) return "取今日日辰";
    const day = dayPillar(date);
    const month = monthBranch(date);
    return `${day.stem}${day.branch}日 · ${month}月${BRANCH_ELEMENT[month]}`;
  })();

  function clearTimer() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }

  function remember(nextLines: YaoValue[]) {
    const item: SavedReading = {
      id: crypto.randomUUID(),
      at: Date.now(),
      question: question.trim(),
      category,
      gender,
      date,
      lines: nextLines,
    };
    setHistory((prev) => [item, ...(prev ?? [])].slice(0, 24));
    setActive(item);
    setPhase("plate");
  }

  function throwLine() {
    if (throwing || lines.length >= 6) return;
    const result = castOnce();
    setThrowing(true);
    setLast(null);
    setCoins(result.coins);
    setSpin((n) => n + 1);
    clearTimer();
    timer.current = window.setTimeout(() => {
      setLines((prev) => (prev.length >= 6 ? prev : [...prev, result.value]));
      setLast({ value: result.value, phrase: coinPhrase(result.coins) });
      setThrowing(false);
    }, motionMs());
  }

  useEffect(() => {
    if (phase !== "cast" || !auto || throwing || lines.length >= 6) return;
    const wait = window.setTimeout(() => throwLine(), 420);
    return () => window.clearTimeout(wait);
    // throwLine closes over the latest lines/throwing; effect re-runs when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, throwing, lines.length, phase]);

  function openCast() {
    clearTimer();
    setLines([]);
    setLast(null);
    setSpin(0);
    setCoins(["zi", "zi", "zi"]);
    setThrowing(false);
    setAuto(false);
    setPhase("cast");
  }

  function openManual() {
    setManual([null, null, null, null, null, null]);
    setPhase("manual");
  }

  const plate: Plate | null =
    phase === "plate" && active
      ? buildPlate({
          question: active.question,
          category: active.category,
          gender: active.gender,
          date: active.date,
          lines: active.lines,
        })
      : null;

  const categoryMeta = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
  const castRows = Array.from({ length: 6 }, (_, index) => {
    const value = lines[index];
    if (value == null) return { yang: true, moving: false, pending: true };
    return { yang: !isYinValue(value), moving: value === 6 || value === 9, value, pending: false };
  });
  const nextPos = LINE_POS[lines.length] ?? "上爻";

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-20">
        <Header pillar={pillar} />

        {phase === "ask" ? (
          <section>
            <label className="block text-sm text-muted" htmlFor="question">
              所问
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="一事一卦。可以不写，但写下来，卦才有所系。"
              className="mt-2 w-full resize-none border border-line bg-paper px-3 py-3 text-ink outline-none"
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted" htmlFor="cast-date">
                占日
              </label>
              <input
                id="cast-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 border border-line bg-paper px-3 text-ink"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="所问之事">
              {CATEGORIES.map((item) => {
                const on = item.id === category;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategory(item.id)}
                    className={
                      on
                        ? "h-11 border border-cinnabar bg-cinnabar px-3 text-on-cinnabar"
                        : "h-11 border border-line bg-paper px-3 text-ink"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted">{categoryMeta.hint}</p>

            {category === "love" ? (
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="问卦者">
                {(
                  [
                    ["unset", "未分"],
                    ["male", "男问"],
                    ["female", "女问"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={gender === id}
                    onClick={() => setGender(id)}
                    className={
                      gender === id
                        ? "h-11 border border-ink bg-ink px-3 text-paper"
                        : "h-11 border border-line bg-paper px-3 text-ink"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!date}
                onClick={openCast}
                className="h-12 bg-cinnabar text-on-cinnabar disabled:opacity-50"
              >
                摇铜钱
              </button>
              <button
                type="button"
                disabled={!date}
                onClick={openManual}
                className="h-12 border border-line bg-paper text-ink disabled:opacity-50"
              >
                自报爻象
              </button>
            </div>

            <section className="mt-12">
              <h2 className="text-lg font-semibold">旧卦</h2>
              {history == null || history.length === 0 ? (
                <p className="mt-2 text-sm text-muted">尚无旧卦。占过的卦留在这台设备上。</p>
              ) : (
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {history.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActive(item);
                          setPhase("plate");
                        }}
                        className="min-h-11 flex-1 text-left"
                      >
                        <span className="block">{item.question || "未录问事"}</span>
                        <span className="text-sm text-muted">
                          {item.date} · {CATEGORIES.find((c) => c.id === item.category)?.label}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistory((prev) => (prev ?? []).filter((row) => row.id !== item.id))}
                        className="h-11 px-2 text-sm text-muted"
                      >
                        删除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        ) : null}

        {phase === "cast" ? (
          <section>
            <p className="text-sm text-muted">
              {categoryMeta.label}
              {question ? ` · ${question}` : ""} · 自下而上
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {lines.length >= 6 ? "六爻已成" : `摇${nextPos}`}
            </h2>

            <div className="mt-8 flex justify-center gap-3">
              {coins.map((face, index) => (
                <Coin key={index} face={face} spin={spin} delay={`${index * 80}ms`} />
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-muted" aria-live="polite">
              {throwing
                ? "铜钱未落"
                : last
                  ? `${last.phrase} · ${YAO_LABEL[last.value].alias} · ${YAO_LABEL[last.value].name}`
                  : "字为阴，记二。背为阳，记三。"}
            </p>

            <div className="mt-8 flex justify-center">
              <HexStack rows={castRows} />
            </div>
            <p className="mt-2 text-center text-sm text-muted">初爻在下</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {lines.length >= 6 ? (
                <button type="button" onClick={() => remember(lines)} className="h-12 bg-cinnabar text-on-cinnabar sm:col-span-2">
                  展开卦盘
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuto(false);
                      throwLine();
                    }}
                    disabled={throwing}
                    className="h-12 bg-cinnabar text-on-cinnabar disabled:opacity-50"
                  >
                    {throwing ? "落下中" : `摇${nextPos}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuto(true)}
                    disabled={throwing || auto}
                    className="h-12 border border-line bg-paper text-ink disabled:opacity-50"
                  >
                    {auto ? "连摇中" : "一次摇完"}
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setAuto(false);
                clearTimer();
                setThrowing(false);
                setPhase("ask");
              }}
              className="mt-4 h-11 text-sm text-muted"
            >
              返回
            </button>
          </section>
        ) : null}

        {phase === "manual" ? (
          <section>
            <h2 className="text-2xl font-semibold">自报爻象</h2>
            <p className="mt-2 text-sm text-muted">按你已经摇出的结果，从初爻填到上爻。老阴六，少阳七，少阴八，老阳九。</p>
            <div className="mt-6 space-y-4">
              {LINE_POS.map((label, index) => (
                <div key={label}>
                  <p className="text-sm text-muted">{label}</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {YAO_OPTIONS.map((value) => {
                      const on = manual[index] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setManual((prev) => {
                              const next = [...prev];
                              next[index] = value;
                              return next;
                            })
                          }
                          className={
                            on
                              ? "h-14 border border-cinnabar bg-cinnabar text-on-cinnabar"
                              : "h-14 border border-line bg-paper text-ink"
                          }
                        >
                          <span className="block text-lg">{value}</span>
                          <span className="block text-xs">{YAO_LABEL[value].name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={manual.some((value) => value == null)}
                onClick={() => remember(manual as YaoValue[])}
                className="h-12 bg-cinnabar text-on-cinnabar disabled:opacity-50"
              >
                装卦
              </button>
              <button type="button" onClick={() => setPhase("ask")} className="h-12 border border-line bg-paper text-ink">
                返回
              </button>
            </div>
          </section>
        ) : null}

        {phase === "plate" && plate ? (
          <PlateView
            plate={plate}
            onAgain={() => {
              setQuestion(active?.question ?? "");
              setCategory(active?.category ?? "general");
              setGender(active?.gender ?? "unset");
              setDate(active?.date || date);
              openCast();
            }}
            onNew={() => {
              setQuestion("");
              setCategory("general");
              setGender("unset");
              setPhase("ask");
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
