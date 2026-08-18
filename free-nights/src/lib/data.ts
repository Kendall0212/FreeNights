import { supabase } from "./supabase";
import { nextColour, nextEmoji } from "./colours";
import { makeShareCode, toKey } from "./dates";
import { SLOTS } from "./types";
import type { Availability, Group, Member, Slot, Status } from "./types";

export async function createGroup(name: string): Promise<Group> {
  const share_code = makeShareCode();
  const { data, error } = await supabase
    .from("groups")
    .insert({ name: name.trim(), share_code })
    .select()
    .single();
  if (error) throw error;
  return data as Group;
}

export async function fetchGroup(shareCode: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("share_code", shareCode)
    .maybeSingle();
  if (error) throw error;
  return (data as Group) ?? null;
}

export async function fetchMembers(groupId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Member[]) ?? [];
}

export async function fetchAvailability(groupId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("group_id", groupId);
  if (error) throw error;
  return (data as Availability[]) ?? [];
}

export async function addMember(
  groupId: string,
  name: string,
  existing: Member[],
  emoji: string
): Promise<Member> {
  const colour = nextColour(existing.map((m) => m.colour));
  const chosen = emoji || nextEmoji(existing.map((m) => m.emoji));
  const { data, error } = await supabase
    .from("members")
    .insert({ group_id: groupId, name: name.trim(), colour, emoji: chosen })
    .select()
    .single();
  if (error) throw error;
  return data as Member;
}

export async function renameMember(memberId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update({ name: name.trim() })
    .eq("id", memberId);
  if (error) throw error;
}

// Set or clear one member's status for a single date + slot.
export async function setStatus(
  groupId: string,
  memberId: string,
  date: string,
  slot: Slot,
  status: Status | null
): Promise<void> {
  if (status === null) {
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("member_id", memberId)
      .eq("date", date)
      .eq("slot", slot);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("availability").upsert(
    { group_id: groupId, member_id: memberId, date, slot, status },
    { onConflict: "member_id,date,slot" }
  );
  if (error) throw error;
}

// Set or clear all three slots across one or many dates at once.
export async function setDaySlots(
  groupId: string,
  memberId: string,
  dates: string[],
  status: Status | null
): Promise<void> {
  if (dates.length === 0) return;

  if (status === null) {
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("member_id", memberId)
      .in("date", dates);
    if (error) throw error;
    return;
  }

  const rows = dates.flatMap((date) =>
    SLOTS.map((slot) => ({
      group_id: groupId,
      member_id: memberId,
      date,
      slot,
      status,
    }))
  );
  const { error } = await supabase
    .from("availability")
    .upsert(rows, { onConflict: "member_id,date,slot" });
  if (error) throw error;
}

// Set one specific slot free/busy across many dates (used for "free weekends").
export async function setSlotDates(
  groupId: string,
  memberId: string,
  dates: string[],
  slot: Slot,
  status: Status
): Promise<void> {
  if (dates.length === 0) return;
  const rows = dates.map((date) => ({
    group_id: groupId,
    member_id: memberId,
    date,
    slot,
    status,
  }));
  const { error } = await supabase
    .from("availability")
    .upsert(rows, { onConflict: "member_id,date,slot" });
  if (error) throw error;
}

export interface UsualSlot {
  id: string;
  group_id: string;
  member_id: string;
  weekday: number; // 0 = Sunday … 6 = Saturday (JS getDay)
  slot: Slot;
}

export async function fetchUsuals(memberId: string): Promise<UsualSlot[]> {
  const { data, error } = await supabase
    .from("usual_slots")
    .select("*")
    .eq("member_id", memberId);
  if (error) throw error;
  return (data as UsualSlot[]) ?? [];
}

// Replace a member's usual weekly free times, then apply them to the next
// 8 weeks (won't touch days they've since changed by hand beyond that window).
export async function saveUsuals(
  groupId: string,
  memberId: string,
  combos: { weekday: number; slot: Slot }[]
): Promise<void> {
  const { error: delErr } = await supabase
    .from("usual_slots")
    .delete()
    .eq("member_id", memberId);
  if (delErr) throw delErr;

  if (combos.length > 0) {
    const rows = combos.map((c) => ({
      group_id: groupId,
      member_id: memberId,
      weekday: c.weekday,
      slot: c.slot,
    }));
    const { error: insErr } = await supabase.from("usual_slots").insert(rows);
    if (insErr) throw insErr;
  }

  const avail: {
    group_id: string;
    member_id: string;
    date: string;
    slot: Slot;
    status: "free";
  }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 56; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wd = d.getDay();
    for (const c of combos) {
      if (c.weekday === wd) {
        avail.push({ group_id: groupId, member_id: memberId, date: toKey(d), slot: c.slot, status: "free" });
      }
    }
  }
  if (avail.length > 0) {
    const { error } = await supabase
      .from("availability")
      .upsert(avail, { onConflict: "member_id,date,slot" });
    if (error) throw error;
  }
}
