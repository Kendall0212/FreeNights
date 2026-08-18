import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Sparkles, PartyPopper, Loader2 } from "lucide-react";
import { useGroup } from "./hooks/useGroup";
import { usePlans } from "./hooks/usePlans";
import {
  setStatus as writeStatus,
  setDaySlots as writeDaySlots,
  setSlotDates as writeSlotDates,
} from "./lib/data";
import { fromKey, toKey } from "./lib/dates";
import { getMemberId, setMemberId } from "./lib/storage";
import JoinName from "./components/JoinName";
import Header from "./components/Header";
import Calendar from "./components/Calendar";
import Overlap from "./components/Overlap";
import DateSheet from "./components/DateSheet";
import Plans from "./components/Plans";
import UsualSheet from "./components/UsualSheet";
import type { Slot, Status } from "./lib/types";

type Tab = "calendar" | "best" | "plans";

// One shared group for the friend circle — loaded from the bare link.
const DEFAULT_CODE = "friends";

function readCode(): string {
  return new URLSearchParams(window.location.search).get("g") || DEFAULT_CODE;
}

function expandRange(startKey: string, endKey: string): string[] {
  const [a, b] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
  const dates: string[] = [];
  const cur = fromKey(a);
  const end = fromKey(b);
  while (cur <= end) {
    dates.push(toKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function upcomingWeekendDates(weeks: number): string[] {
  const dates: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.getDay();
    if (dow === 5 || dow === 6) dates.push(toKey(d));
  }
  return dates;
}

export default function App() {
  const [shareCode] = useState<string>(readCode());
  const [meId, setMeId] = useState<string | null>(getMemberId(shareCode));
  const [tab, setTab] = useState<Tab>("calendar");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [openUsual, setOpenUsual] = useState(false);

  const { group, members, availability, loading, notFound, error, reload } =
    useGroup(shareCode);
  const { plans, rsvps, reactions, comments, venues, venueVotes, reloadPlans } =
    usePlans(group?.id ?? null);

  useEffect(() => {
    setMeId(getMemberId(shareCode));
  }, [shareCode]);

  const me = useMemo(
    () => members.find((m) => m.id === meId) ?? null,
    [members, meId]
  );

  function onJoined(memberId: string) {
    setMemberId(shareCode, memberId);
    setMeId(memberId);
    void reload();
  }

  async function handleSet(slot: Slot, status: Status | null) {
    if (!group || !me || !openDate) return;
    try {
      await writeStatus(group.id, me.id, openDate, slot, status);
      await reload();
    } catch {
      // realtime reconciles
    }
  }

  async function handleSetAllDay(status: Status | null) {
    if (!group || !me || !openDate) return;
    try {
      await writeDaySlots(group.id, me.id, [openDate], status);
      await reload();
    } catch {
      // realtime reconciles
    }
  }

  async function handleSetRange(startKey: string, endKey: string, status: Status | null) {
    if (!group || !me) return;
    try {
      await writeDaySlots(group.id, me.id, expandRange(startKey, endKey), status);
      await reload();
    } catch {
      // realtime reconciles
    }
  }

  async function handleFreeWeekends() {
    if (!group || !me) return;
    try {
      await writeSlotDates(group.id, me.id, upcomingWeekendDates(8), "evening", "free");
      await reload();
    } catch {
      // realtime reconciles
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin text-mulberry" size={28} />
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <h2 className="font-display font-extrabold text-2xl text-ink">
          Couldn't load this just now
        </h2>
        <p className="text-muted mt-2">
          {notFound ? "Give it a moment and try again." : error}
        </p>
        <button
          onClick={() => reload()}
          className="mt-5 rounded-2xl bg-mulberry px-6 py-3 font-semibold text-white shadow-glow active:scale-95"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!group) return null;

  if (!me) {
    return <JoinName group={group} members={members} onJoined={(m) => onJoined(m.id)} />;
  }

  return (
    <div className="min-h-dvh pb-24">
      <Header me={me} />

      {tab === "calendar" && (
        <Calendar
          me={me}
          members={members}
          availability={availability}
          onPickDate={setOpenDate}
          onSetRange={handleSetRange}
          onFreeWeekends={handleFreeWeekends}
          onOpenUsual={() => setOpenUsual(true)}
        />
      )}
      {tab === "best" && <Overlap members={members} availability={availability} />}
      {tab === "plans" && (
        <Plans
          group={group}
          me={me}
          members={members}
          plans={plans}
          rsvps={rsvps}
          reactions={reactions}
          comments={comments}
          venues={venues}
          venueVotes={venueVotes}
          onChanged={reloadPlans}
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-mist bg-paper/90 backdrop-blur-md">
        <div className="mx-auto max-w-md grid grid-cols-3">
          <TabButton
            active={tab === "calendar"}
            onClick={() => setTab("calendar")}
            icon={<CalendarDays size={20} />}
            label="Calendar"
          />
          <TabButton
            active={tab === "best"}
            onClick={() => setTab("best")}
            icon={<Sparkles size={20} />}
            label="Best times"
          />
          <TabButton
            active={tab === "plans"}
            onClick={() => setTab("plans")}
            icon={<PartyPopper size={20} />}
            label="Plans"
          />
        </div>
      </nav>

      {openDate && (
        <DateSheet
          dateKey={openDate}
          me={me}
          members={members}
          availability={availability}
          onSet={handleSet}
          onSetAllDay={handleSetAllDay}
          onClose={() => setOpenDate(null)}
        />
      )}

      {openUsual && (
        <UsualSheet
          group={group}
          me={me}
          onClose={() => setOpenUsual(false)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 transition ${
        active ? "text-mulberry" : "text-muted"
      }`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
