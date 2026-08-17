import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  isPast,
  monthGrid,
  monthTitle,
  sameMonth,
  toKey,
} from "../lib/dates";
import { dayFreeCount } from "../lib/overlap";
import type { Availability, Member } from "../lib/types";

interface Props {
  me: Member;
  members: Member[];
  availability: Availability[];
  onPickDate: (key: string) => void;
}

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export default function Calendar({ me, members, availability, onPickDate }: Props) {
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [anchor, setAnchor] = useState<Date>(thisMonth);

  const weeks = useMemo(() => monthGrid(anchor), [anchor]);
  const total = Math.max(members.length, 1);
  const atStart = sameMonth(anchor, thisMonth);

  const myDays = useMemo(() => {
    const set = new Set<string>();
    for (const a of availability) if (a.member_id === me.id) set.add(a.date);
    return set;
  }, [availability, me.id]);

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
          const past = isPast(day);
          const disabled = past || !inMonth;
          const free = dayFreeCount(availability, key);
          const intensity = Math.min(free / total, 1);
          const mine = myDays.has(key);

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onPickDate(key)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition active:scale-95 ${
                disabled
                  ? "text-mist"
                  : "text-ink bg-white shadow-card hover:ring-2 hover:ring-mulberry/20"
              }`}
              style={
                !disabled && intensity > 0
                  ? {
                      backgroundColor: `rgba(178,68,104,${0.12 + intensity * 0.6})`,
                      color: intensity > 0.5 ? "#fff" : undefined,
                    }
                  : undefined
              }
            >
              <span className={`text-sm ${inMonth ? "" : "opacity-40"}`}>
                {day.getDate()}
              </span>
              {!disabled && free > 0 && (
                <span className="font-mono text-[10px] leading-none mt-0.5">
                  {free}
                </span>
              )}
              {mine && (
                <span
                  className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: me.colour }}
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-muted text-sm mt-4 text-center">
        Tap a day to set your morning, afternoon and evening. Brighter days = more
        friends free.
      </p>
    </div>
  );
}
