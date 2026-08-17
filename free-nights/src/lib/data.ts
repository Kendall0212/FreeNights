import { supabase } from "./supabase";
import { nextColour } from "./colours";
import { makeShareCode } from "./dates";
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
  existing: Member[]
): Promise<Member> {
  const colour = nextColour(existing.map((m) => m.colour));
  const { data, error } = await supabase
    .from("members")
    .insert({ group_id: groupId, name: name.trim(), colour })
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
// Powers "free/busy all day" (one date) and marking a range (many dates).
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
