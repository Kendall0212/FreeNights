import type { Availability, Member, Slot, Status } from "./types";
import { SLOTS } from "./types";

export interface SlotTally {
  date: string;
  slot: Slot;
  free: Member[];
  maybe: Member[];
}

function key(date: string, slot: Slot): string {
  return `${date}|${slot}`;
}

// Status for one member on one date+slot, or null if unset.
export function statusOf(
  availability: Availability[],
  memberId: string,
  date: string,
  slot: Slot
): Status | null {
  const row = availability.find(
    (a) => a.member_id === memberId && a.date === date && a.slot === slot
  );
  return row ? row.status : null;
}

// Free count per day (best slot), used for the calendar glow dots.
export function dayFreeCount(availability: Availability[], date: string): number {
  let best = 0;
  for (const slot of SLOTS) {
    let n = 0;
    for (const a of availability) {
      if (a.date === date && a.slot === slot && a.status === "free") n++;
    }
    if (n > best) best = n;
  }
  return best;
}

export function tallies(
  dates: string[],
  members: Member[],
  availability: Availability[]
): SlotTally[] {
  const byMember = new Map<string, Member>();
  for (const m of members) byMember.set(m.id, m);

  const buckets = new Map<string, SlotTally>();
  for (const date of dates) {
    for (const slot of SLOTS) {
      buckets.set(key(date, slot), { date, slot, free: [], maybe: [] });
    }
  }

  for (const a of availability) {
    const bucket = buckets.get(key(a.date, a.slot as Slot));
    if (!bucket) continue;
    const member = byMember.get(a.member_id);
    if (!member) continue;
    if (a.status === "free") bucket.free.push(member);
    else if (a.status === "maybe") bucket.maybe.push(member);
  }

  return Array.from(buckets.values());
}

// Ranked best times: most free first, then soonest, then most maybes.
export function rankTallies(all: SlotTally[]): SlotTally[] {
  return all
    .filter((t) => t.free.length > 0 || t.maybe.length > 0)
    .sort((a, b) => {
      if (b.free.length !== a.free.length) return b.free.length - a.free.length;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return b.maybe.length - a.maybe.length;
    });
}
