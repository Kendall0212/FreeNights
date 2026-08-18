import { useMemo, useState } from "react";
import { Sparkles, Users, CalendarClock, Bell, Check } from "lucide-react";
import Avatar from "./Avatar";
import { prettyDate, toKey } from "../lib/dates";
import { rankTallies, tallies } from "../lib/overlap";
import { SLOT_COLOUR, SLOT_LABEL } from "../lib/types";
import type { Member, Availability } from "../lib/types";
import type { SlotTally as Tally } from "../lib/overlap";

interface Props {
  members: Member[];
  availability: Availability[];
}

const HORIZON_DAYS = 56;

export default function Overlap({ members, availability }: Props) {
  const [onlyEveryone, setOnlyEveryone] = useState(false);
  const [thisWeek, setThisWeek] = useState(false);
  const [poked, setPoked] = useState(false);

  const ranked = useMemo(() => {
    const dates: string[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(toKey(d));
    }
    return rankTallies(tallies(dates, members, availability));
  }, [members, availability]);

  // Whoever hasn't entered any availability yet — the usual bottleneck.
  const notYet = useMemo(() => {
    const answered = new Set(availability.map((a) => a.member_id));
    return members.filter((m) => !answered.has(m.id));
  }, [members, availability]);

  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 7);
    return toKey(d);
  }, []);

  const total = Math.max(members.length, 1);
  const canFilter = members.length > 1;

  let shown = ranked;
  if (onlyEveryone) shown = shown.filter((t) => t.free.length === members.length);
  if (thisWeek) shown = shown.filter((t) => t.date <= weekEnd);

  async function poke() {
    const names = notYet.map((m) => m.name).join(", ");
    const link = `${window.location.origin}${window.location.pathname}`;
    const msg = `we're picking a night 🌙 ${names} — add when you're free 👉 ${link}`;
    try {
      await navigator.clipboard.writeText(msg);
      setPoked(true);
      setTimeout(() => setPoked(false), 1800);
    } catch {
      window.prompt("Copy this to send to the group:", msg);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-5">
      <h2 className="font-display font-extrabold text-2xl text-ink mb-1">Best times</h2>
      <p className="text-muted text-sm mb-4">Most people free, soonest first.</p>

      {notYet.length > 0 && members.length > 1 && (
        <div className="rounded-2xl bg-white p-4 shadow-card mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink text-sm">Waiting on</span>
            {notYet.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1">
                <Avatar name={m.name} colour={m.colour} emoji={m.emoji} size={20} />
                <span className="text-sm text-ink">{m.name}</span>
              </span>
            ))}
          </div>
          <button
            onClick={poke}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mulberry px-3.5 py-2 text-sm font-semibold text-white shadow-glow active:scale-95"
          >
            {poked ? <Check size={16} /> : <Bell size={16} />}
            {poked ? "Copied — paste it!" : "Poke them"}
          </button>
        </div>
      )}

      {canFilter && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setOnlyEveryone((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
              onlyEveryone
                ? "bg-mulberry text-white shadow-glow"
                : "border border-mist bg-white text-ink shadow-card"
            }`}
          >
            <Users size={16} />
            Everyone free
          </button>
          <button
            onClick={() => setThisWeek((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
              thisWeek
                ? "bg-mulberry text-white shadow-glow"
                : "border border-mist bg-white text-ink shadow-card"
            }`}
          >
            <CalendarClock size={16} />
            This week
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="py-14 text-center">
          <Sparkles className="mx-auto text-muted mb-3" size={28} />
          <h3 className="font-display font-extrabold text-xl text-ink">
            {thisWeek
              ? "Nothing this week yet"
              : onlyEveryone
              ? "No nights work for everyone yet"
              : "Nothing lit up yet"}
          </h3>
          <p className="text-muted mt-2">
            {thisWeek
              ? "Try turning off “This week” to see further ahead."
              : onlyEveryone
              ? "Try turning off the filter to see the closest matches."
              : "Once people mark free times, the best nights show up here."}
          </p>
        </div>
      ) : (
        <>
          <TopCard tally={shown[0]} total={total} />
          <div className="mt-4 space-y-2">
            {shown.slice(1, 21).map((t) => (
              <Row key={`${t.date}-${t.slot}`} tally={t} total={total} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function glow(free: number, total: number): number {
  return Math.min(free / total, 1);
}

function TopCard({ tally, total }: { tally: Tally; total: number }) {
  const g = glow(tally.free.length, total);
  return (
    <div
      className="rounded-3xl p-5 text-white shadow-glow"
      style={{
        background: `linear-gradient(150deg, ${SLOT_COLOUR[tally.slot]} 0%, #B24468 100%)`,
        opacity: 0.65 + g * 0.35,
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
        {SLOT_LABEL[tally.slot]}
      </p>
      <p className="font-display font-extrabold text-3xl mt-1">
        {prettyDate(tally.date)}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 mt-4">
        {tally.free.map((m) => (
          <Avatar key={m.id} name={m.name} colour={m.colour} emoji={m.emoji} size={30} />
        ))}
        {tally.maybe.map((m) => (
          <Avatar key={m.id} name={m.name} colour={m.colour} emoji={m.emoji} size={30} dim />
        ))}
      </div>
      <p className="font-mono text-sm mt-3 text-white/90">
        {tally.free.length} of {total} free
        {tally.maybe.length > 0 ? ` · ${tally.maybe.length} maybe` : ""}
      </p>
    </div>
  );
}

function Row({ tally, total }: { tally: Tally; total: number }) {
  const g = glow(tally.free.length, total);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
      <div className="flex flex-col items-center w-14 shrink-0">
        <span
          className="h-2.5 w-2.5 rounded-full mb-1"
          style={{ background: SLOT_COLOUR[tally.slot] }}
        />
        <span className="font-mono text-[10px] uppercase text-muted">
          {SLOT_LABEL[tally.slot].slice(0, 3)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{prettyDate(tally.date)}</p>
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {tally.free.map((m) => (
            <Avatar key={m.id} name={m.name} colour={m.colour} emoji={m.emoji} size={20} />
          ))}
          {tally.maybe.map((m) => (
            <Avatar key={m.id} name={m.name} colour={m.colour} emoji={m.emoji} size={20} dim />
          ))}
        </div>
      </div>
      <div
        className="rounded-xl px-2.5 py-1 font-mono text-sm font-bold shrink-0"
        style={{
          backgroundColor: `rgba(178,68,104,${0.12 + g * 0.55})`,
          color: g > 0.5 ? "#fff" : "#8A3050",
        }}
      >
        {tally.free.length}
      </div>
    </div>
  );
}
