import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Sparkles, Loader2 } from "lucide-react";
import { useGroup } from "./hooks/useGroup";
import { setStatus as writeStatus, setDaySlots as writeDaySlots } from "./lib/data";
import { fromKey, toKey } from "./lib/dates";
import { getMemberId, setMemberId } from "./lib/storage";
import Landing from "./components/Landing";
import JoinName from "./components/JoinName";
import Header from "./components/Header";
import Calendar from "./components/Calendar";
import Overlap from "./components/Overlap";
import DateSheet from "./components/DateSheet";
import type { Group, Slot, Status } from "./lib/types";

type Tab = "calendar" | "best";

function readCode(): string | null {
  return new URLSearchParams(window.location.search).get("g");
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

export default function App() {
  const [shareCode, setShareCode] = useState<string | null>(readCode());
  const [meId, setMeId] = useState<string | null>(
    shareCode ? getMemberId(shareCode) : null
  );
  const [tab, setTab] = useState<Tab>("calendar");
  const [openDate, setOpenDate] = useState<string | null>(null);

  const { group, members, availability, loading, notFound, error, reload } =
    useGroup(shareCode);

  useEffect(() => {
    setMeId(shareCode ? getMemberId(shareCode) : null);
  }, [shareCode]);

  const me = useMemo(
    () => members.find((m) => m.id === meId) ?? null,
    [members, meId]
  );

  function onCreated(g: Group) {
    const url = `${window.location.pathname}?g=${g.share_code}`;
    window.history.replaceState({}, "", url);
    setShareCode(g.share_code);
  }

  function onJoined(memberId: string) {
    if (!shareCode) return;
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
      // realtime will still reconcile; a failed write just won't persist
    }
  }

  async function handleSetAllDay(status: Status | null) {
    if (!group || !me || !openDate) return;
    try {
      await writeDaySlots(group.id, me.id, [openDate], status);
      await reload();
    } catch {
      // no-op; realtime reconciles
    }
  }

  async function handleSetRange(startKey: string, endKey: string, status: Status | null) {
    if (!group || !me) return;
    try {
      await writeDaySlots(group.id, me.id, expandRange(startKey, endKey), status);
      await reload();
    } catch {
      // no-op; realtime reconciles
    }
  }

  if (!shareCode) return <Landing onCreated={onCreated} />;

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
          {notFound ? "This group link isn't working" : "Something went wrong"}
        </h2>
        <p className="text-muted mt-2">
          {notFound
            ? "The link may be mistyped. Ask whoever shared it to send it again."
            : error}
        </p>
        <button
          onClick={() => {
            window.history.replaceState({}, "", window.location.pathname);
            setShareCode(null);
          }}
          className="mt-5 rounded-2xl bg-mulberry px-6 py-3 font-semibold text-white shadow-glow active:scale-95"
        >
          Start a new group
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
      <Header group={group} me={me} />

      {tab === "calendar" ? (
        <Calendar
          me={me}
          members={members}
          availability={availability}
          onPickDate={setOpenDate}
          onSetRange={handleSetRange}
        />
      ) : (
        <Overlap members={members} availability={availability} />
      )}

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-mist bg-paper/90 backdrop-blur-md">
        <div className="mx-auto max-w-md grid grid-cols-2">
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
