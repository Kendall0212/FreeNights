import { X } from "lucide-react";
import Avatar from "./Avatar";
import { prettyDate } from "../lib/dates";
import { statusOf } from "../lib/overlap";
import {
  SLOTS,
  SLOT_COLOUR,
  SLOT_HINT,
  SLOT_LABEL,
  STATUS_LABEL,
} from "../lib/types";
import type { Availability, Member, Slot, Status } from "../lib/types";

interface Props {
  dateKey: string;
  me: Member;
  members: Member[];
  availability: Availability[];
  onSet: (slot: Slot, status: Status | null) => void;
  onClose: () => void;
}

const OPTIONS: Status[] = ["free", "maybe", "busy"];

const ACTIVE_BG: Record<Status, string> = {
  free: "bg-mulberry text-white",
  maybe: "bg-gold text-white",
  busy: "bg-mist text-muted",
};

export default function DateSheet({
  dateKey,
  me,
  members,
  availability,
  onSet,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-paper p-5 pb-8 animate-rise">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-2xl text-ink">
            {prettyDate(dateKey)}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white p-2 text-muted shadow-card active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {SLOTS.map((slot) => {
            const mine = statusOf(availability, me.id, dateKey, slot);
            const others = othersBy(members, availability, dateKey, slot, me.id);
            return (
              <div key={slot} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: SLOT_COLOUR[slot] }}
                  />
                  <span className="font-semibold text-ink">{SLOT_LABEL[slot]}</span>
                  <span className="font-mono text-[11px] text-muted">
                    {SLOT_HINT[slot]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {OPTIONS.map((opt) => {
                    const active = mine === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => onSet(slot, active ? null : opt)}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
                          active ? ACTIVE_BG[opt] : "bg-paper text-ink border border-mist"
                        }`}
                      >
                        {STATUS_LABEL[opt]}
                      </button>
                    );
                  })}
                </div>

                {(others.free.length > 0 || others.maybe.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {others.free.map((m) => (
                      <Avatar key={m.id} name={m.name} colour={m.colour} size={24} />
                    ))}
                    {others.maybe.map((m) => (
                      <Avatar key={m.id} name={m.name} colour={m.colour} size={24} dim />
                    ))}
                    <span className="font-mono text-[11px] text-muted ml-0.5">
                      {others.free.length} free
                      {others.maybe.length > 0 ? ` · ${others.maybe.length} maybe` : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function othersBy(
  members: Member[],
  availability: Availability[],
  dateKey: string,
  slot: Slot,
  meId: string
): { free: Member[]; maybe: Member[] } {
  const free: Member[] = [];
  const maybe: Member[] = [];
  for (const m of members) {
    if (m.id === meId) continue;
    const s = statusOf(availability, m.id, dateKey, slot);
    if (s === "free") free.push(m);
    else if (s === "maybe") maybe.push(m);
  }
  return { free, maybe };
}
