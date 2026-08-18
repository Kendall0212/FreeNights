import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchUsuals, saveUsuals } from "../lib/data";
import { SLOTS, SLOT_COLOUR, SLOT_LABEL } from "../lib/types";
import type { Group, Member, Slot } from "../lib/types";

interface Props {
  group: Group;
  me: Member;
  onClose: () => void;
  onChanged: () => void;
}

// Monday-first display, storing JS getDay() numbers (0 = Sunday).
const DAYS: { wd: number; label: string }[] = [
  { wd: 1, label: "Mon" },
  { wd: 2, label: "Tue" },
  { wd: 3, label: "Wed" },
  { wd: 4, label: "Thu" },
  { wd: 5, label: "Fri" },
  { wd: 6, label: "Sat" },
  { wd: 0, label: "Sun" },
];

function key(wd: number, slot: Slot): string {
  return `${wd}-${slot}`;
}

export default function UsualSheet({ group, me, onClose, onChanged }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchUsuals(me.id)
      .then((rows) => {
        if (!active) return;
        setSelected(new Set(rows.map((r) => key(r.weekday, r.slot))));
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [me.id]);

  function toggle(wd: number, slot: Slot) {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = key(wd, slot);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    const combos = Array.from(selected).map((k) => {
      const [wd, slot] = k.split("-");
      return { weekday: Number(wd), slot: slot as Slot };
    });
    try {
      await saveUsuals(group.id, me.id, combos);
      onChanged();
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-paper p-5 pb-8 animate-rise max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-extrabold text-2xl text-ink">Your usual</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white p-2 text-muted shadow-card active:scale-95 shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-muted text-sm mb-4">
          Tap the times you're usually free. We'll mark them free for the next 8 weeks.
        </p>

        {loading ? (
          <p className="text-muted text-sm py-8 text-center">Loading…</p>
        ) : (
          <div className="space-y-2">
            {DAYS.map(({ wd, label }) => (
              <div key={wd} className="flex items-center gap-2">
                <span className="w-10 font-mono text-xs text-muted shrink-0">{label}</span>
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  {SLOTS.map((slot) => {
                    const on = selected.has(key(wd, slot));
                    return (
                      <button
                        key={slot}
                        onClick={() => toggle(wd, slot)}
                        className={`rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${
                          on ? "text-white" : "bg-white text-ink border border-mist"
                        }`}
                        style={on ? { backgroundColor: SLOT_COLOUR[slot] } : undefined}
                      >
                        {SLOT_LABEL[slot].slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={save}
          disabled={busy || loading}
          className="mt-5 w-full rounded-2xl bg-mulberry py-3.5 text-lg font-semibold text-white shadow-glow active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save my usual"}
        </button>
      </div>
    </div>
  );
}
