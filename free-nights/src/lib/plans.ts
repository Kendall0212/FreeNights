import { supabase } from "./supabase";
import type { Slot } from "./types";

export type RsvpStatus = "in" | "out";

export interface Plan {
  id: string;
  group_id: string;
  date: string;
  slot: Slot | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Rsvp {
  id: string;
  plan_id: string;
  member_id: string;
  status: RsvpStatus;
  created_at: string;
}

export async function fetchPlans(groupId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("group_id", groupId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data as Plan[]) ?? [];
}

export async function fetchRsvps(planIds: string[]): Promise<Rsvp[]> {
  if (planIds.length === 0) return [];
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .in("plan_id", planIds);
  if (error) throw error;
  return (data as Rsvp[]) ?? [];
}

export async function createPlan(
  groupId: string,
  date: string,
  slot: Slot | null,
  note: string | null,
  createdBy: string
): Promise<Plan> {
  const { data, error } = await supabase
    .from("plans")
    .insert({
      group_id: groupId,
      date,
      slot,
      note: note?.trim() || null,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Plan;
}

export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw error;
}

export async function setRsvp(
  planId: string,
  memberId: string,
  status: RsvpStatus
): Promise<void> {
  const { error } = await supabase
    .from("rsvps")
    .upsert(
      { plan_id: planId, member_id: memberId, status },
      { onConflict: "plan_id,member_id" }
    );
  if (error) throw error;
}
