import type { Plate, PlateLine } from "@/lib/liuyao/engine";
import { classicalLineName, LINE_POS } from "@/lib/liuyao/names";
import { HexStack, YaoBar } from "./figures";

function Seal({ children, hot }: { children: string; hot?: boolean }) {
  return (
    <span
      className={
        hot
          ? "inline-flex h-5 min-w-5 items-center justify-center border border-cinnabar px-1 text-xs text-cinnabar"
          : "inline-flex h-5 min-w-5 items-center justify-center border border-line px-1 text-xs text-muted"
      }
    >
      {children}
    </span>
  );
}

function LineRow({ line }: { line: PlateLine }) {
  return (
    <article className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 border-b border-line py-3">
      <p className="text-sm text-muted">{line.spirit}</p>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={line.moving ? "text-cinnabar" : "text-ink"}>{line.relation}</span>
          <span className="text-sm text-muted">
            {line.stem}
            {line.branch}
            {line.element}
          </span>
          {line.shi ? <Seal hot>世</Seal> : null}
          {line.ying ? <Seal>应</Seal> : null}
          {line.moving ? <span className="text-cinnabar">{line.value === 9 ? "○" : "×"}</span> : null}
        </div>
        <p className="text-sm text-muted">{[line.season, ...line.marks].join(" · ")}</p>
        {line.changed ? (
          <p className="text-sm">
            化 {line.changed.relation}
            {line.changed.branch}
            {line.changed.element}
            {line.changed.tags.length ? ` · ${line.changed.tags.join(" · ")}` : ""}
          </p>
        ) : null}
        {line.fu ? (
          <p className="text-sm text-muted">
            伏 {line.fu.relation}
            {line.fu.branch}
            {line.fu.element}
          </p>
        ) : null}
      </div>
      <YaoBar yang={line.yang} moving={line.moving} />
    </article>
  );
}

export function PlateView({
  plate,
  onAgain,
  onNew,
}: {
  plate: Plate;
  onAgain: () => void;
  onNew: () => void;
}) {
  const moving = plate.lines.filter((line) => line.moving);
  const allNine = plate.lines.every((line) => line.value === 9);
  const allSix = plate.lines.every((line) => line.value === 6);
  const shown = [...plate.lines].reverse();

  return (
    <div>
      <p className="text-sm text-muted">
        {plate.dateLabel} · {plate.dayLabel}日 · {plate.monthBranch}月 · {plate.categoryLabel}
        {plate.category === "love" && plate.gender === "male" ? " · 男" : ""}
        {plate.category === "love" && plate.gender === "female" ? " · 女" : ""}
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words">{plate.question || "未录问事"}</h2>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <p className="text-sm tracking-widest text-muted">本卦</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">{plate.original.fullName}</h3>
              <p className="text-sm text-muted">
                {plate.original.palace}宫 · {plate.original.generation} · 第{plate.original.record.kingWen}卦
              </p>
            </div>
            <p className="text-5xl leading-none text-ink">{plate.original.unicode}</p>
          </div>
          <div className="mt-5">
            <HexStack
              rows={plate.lines.map((line) => ({
                yang: line.yang,
                moving: line.moving,
                value: line.value,
              }))}
            />
          </div>
          <p className="mt-5">{plate.original.record.judgement}</p>
          <p className="mt-1 text-sm text-muted">{plate.original.record.gloss}</p>
        </section>

        <section>
          <p className="text-sm tracking-widest text-muted">之卦</p>
          {plate.changed ? (
            <>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{plate.changed.fullName}</h3>
                  <p className="text-sm text-muted">
                    {plate.changed.palace}宫 · {plate.changed.generation}
                  </p>
                </div>
                <p className="text-5xl leading-none">{plate.changed.unicode}</p>
              </div>
              <div className="mt-5">
                <HexStack
                  rows={plate.lines.map((line) => ({
                    yang: line.changed ? line.changed.yang : line.yang,
                    moving: false,
                  }))}
                />
              </div>
              <p className="mt-5">{plate.changed.record.judgement}</p>
              <p className="mt-1 text-sm text-muted">{plate.changed.record.gloss}</p>
            </>
          ) : (
            <p className="mt-3 text-muted">六爻安静，没有变卦。</p>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-lg font-semibold">卦盘</h3>
          <p className="text-sm text-muted">
            六神{plate.spiritRule} · 旬空{plate.kong.join("")} · {plate.yongLabel}
          </p>
        </div>
        <div className="mt-2">
          {shown.map((line) => (
            <LineRow key={line.index} line={line} />
          ))}
          <p className="mt-2 text-sm text-muted">自上而下为上爻至初爻。起卦仍自下而上。</p>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold">装卦提要</h3>
        <div className="mt-3 space-y-2">
          {plate.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold">{moving.length ? "动爻爻辞" : "卦辞为主"}</h3>
        {moving.length === 0 ? (
          <p className="mt-3">六爻不动，以本卦卦辞为文。各爻爻辞附后，供对照。</p>
        ) : (
          <div className="mt-3 space-y-4">
            {moving.map((line) => (
              <p key={line.index}>
                <span className="text-cinnabar">
                  {classicalLineName(line.index, !line.yang)} · {LINE_POS[line.index]}
                </span>
                <span className="mt-1 block">{plate.original.record.lines[line.index]}</span>
              </p>
            ))}
          </div>
        )}
        {allNine ? <p className="mt-3 text-cinnabar">用九：见群龙无首，吉。</p> : null}
        {allSix ? <p className="mt-3 text-cinnabar">用六：利永贞。</p> : null}
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold">六爻爻辞</h3>
        <ol className="mt-3 space-y-3">
          {plate.lines.map((line) => (
            <li key={line.index} className={line.moving ? "border-l-2 border-cinnabar pl-3" : ""}>
              <span className={line.moving ? "text-cinnabar" : "text-muted"}>
                {classicalLineName(line.index, !line.yang)}
              </span>
              <span className="ml-2">{plate.original.record.lines[line.index]}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-sm text-muted">
        纳甲装卦，据京房八宫世应与《周易》经文对照。旺衰只标月令与日辰，不断吉凶，亦非医疗、法律或财务建议。
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onAgain} className="h-12 bg-cinnabar text-on-cinnabar">
          同问再占
        </button>
        <button type="button" onClick={onNew} className="h-12 border border-line bg-paper text-ink">
          另起一事
        </button>
      </div>
    </div>
  );
}
