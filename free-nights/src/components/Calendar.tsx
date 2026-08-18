import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarRange, X, Sparkles, Repeat } from "lucide-react";
import {
  addMonths,
  isPast,
  monthGrid,
  monthTitle,
  prettyDate,
  sameMonth,
  toKey,
} from "../lib/dates";
import type { Availability, Member, Status } from "../lib/types";

interface Props {
  me: Member;
  members: Member[];
  availability: Availability[];
  onPickDate: (key: string) => void;
  onSetRange: (startKey: string, endKey: string, status: Status | null) => void;
  onFreeWeekends: () => void;
  onOpenUsual: () => void;
}

const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const MAX_DOTS = 3;

function countDaysInclusive(a: string, b: string): number {
  const start = new Date(a);
  const end = new Date(b);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export default function Calendar({
  me,
  members,
  availability,
  onPickDate,
  onSetRange,
  onFreeWeekends,
  onOpenUsual,
}: Props) {
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [anchor, setAnchor] = useState<Date>(thisMonth);
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const weeks = useMemo(() => monthGrid(anchor), [anchor]);
  const atStart = sameMonth(anchor, thisMonth);

  const memberById = useMemo(() => {
    const m = new Map<string, Member>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  const freeByDate = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const a of availability) {
      if (a.status !== "free") continue;
      let set = m.get(a.date);
      if (!set) {
        set = new Set<string>();
        m.set(a.date, set);
      }
      set.add(a.member_id);
    }
    return m;
  }, [availability]);

  const mineDates = useMemo(() => {
    const s = new Set<string>();
    for (const a of availability) if (a.member_id === me.id) s.add(a.date);
    return s;
  }, [availability, me.id]);

  const lo = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd) : rangeStart;
  const hi = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart) : rangeStart;

  function inRange(key: string): boolean {
    if (!lo) return false;
    if (!rangeEnd) return key === lo;
    return key >= lo && key <= (hi as string);
  }

  function handleDay(key: string) {
    if (!rangeMode) {
      onPickDate(key);
      return;
    }
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(key);
      setRangeEnd(null);
    } else {
      setRangeEnd(key);
    }
  }

  function exitRange() {
    setRangeMode(false);
    setRangeStart(null);
    setRangeEnd(null);
  }

  function applyRange(status: Status | null) {
    if (lo && hi) onSetRange(lo, hi as string, status);
    exitRange();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-extrabold text-2xl text-ink">
          {monthTitle(anchor)}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => !atStart && setAnchor(addMonths(anchor, -1))}
            disabled={atStart}
            aria-label="Previous month"
            className="rounded-full bg-white p-2 shadow-card text-ink disabled:opacity-30 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setAnchor(addMonths(anchor, 1))}
            aria-label="Next month"
            className="rounded-full bg-white p-2 shadow-card text-ink active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {!rangeMode ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onFreeWeekends}
            className="inline-flex items-center gap-2 rounded-full bg-mulberry px-3.5 py-2 text-sm font-semibold text-white shadow-glow active:scale-95"
          >
            <Sparkles size={16} />
            Free weekends
          </button>
          <button
            onClick={() => setRangeMode(true)}
            className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-card active:scale-95"
          >
            <CalendarRange size={16} />
            Mark a range
          </button>
          <button
            onClick={onOpenUsual}
            className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-card active:scale-95"
          >
            <Repeat size={16} />
            My usual
          </button>
        </div>
      ) : (
        <div className="mb-3 rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {!rangeStart
                ? "Tap the first day"
                : !rangeEnd
                ? "Now tap the last day"
                : `${prettyDate(lo as string)} → ${prettyDate(hi as string)} · ${countDaysInclusive(lo as string, hi as string)} days`}
            </p>
            <button
              onClick={exitRange}
              aria-label="Cancel range"
              className="rounded-full p-1 text-muted active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
          {rangeStart && rangeEnd && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => applyRange("free")}
                className="rounded-xl bg-mulberry py-2.5 text-sm font-semibold text-white active:scale-95"
              >
                Free
              </button>
              <button
                onClick={() => applyRange("busy")}
                className="rounded-xl bg-ink py-2.5 text-sm font-semibold text-white active:scale-95"
              >
                Busy
              </button>
              <button
                onClick={() => applyRange(null)}
                className="rounded-xl border border-mist py-2.5 text-sm font-semibold text-muted active:scale-95"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-7 mb-2">
        {DOW.map((d, i) => (
          <div key={i} className="text-center font-mono text-[11px] text-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, idx) => {
          const key = toKey(day);
          const inMonth = sameMonth(day, anchor);
          const disabled = isPast(day) || !inMonth;

          const freeIds = freeByDate.get(key);
          const freeMembers = freeIds
            ? Array.from(freeIds)
                .map((id) => memberById.get(id))
                .filter((m): m is Member => !!m)
            : [];
          const overflow = freeMembers.length - MAX_DOTS;
          const selected = rangeMode && inRange(key);
          const mine = mineDates.has(key);

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => handleDay(key)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 gap-1 transition active:scale-95 ${
                disabled
                  ? "text-mist"
                  : selected
                  ? "bg-mulberry text-white"
                  : "text-ink bg-white shadow-card hover:ring-2 hover:ring-mulberry/20"
              } ${mine && !selected && !disabled ? "ring-1 ring-mulberry/40" : ""}`}
            >
              <span className={`text-sm leading-none ${inMonth ? "" : "opacity-40"}`}>
                {day.getDate()}
              </span>
              {!disabled && freeMembers.length > 0 && (
                <div className="flex items-center justify-center gap-0.5 flex-wrap px-0.5">
                  {freeMembers.slice(0, MAX_DOTS).map((m) => (
                    <span
                      key={m.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: selected ? "#fff" : m.colour }}
                    />
                  ))}
                  {overflow > 0 && (
                    <span
                      className={`font-mono text-[9px] leading-none ${
                        selected ? "text-white" : "text-muted"
                      }`}
                    >
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-muted text-sm mt-4 text-center">
        {rangeMode
          ? "Pick a start and end day, then mark the whole stretch free or busy."
          : "Dots show who's free. Tap a day to set your times and see everyone's."}
      </p>
    </div>
  );
}
