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
  confirmed: boolean;
  created_at: string;
}

export interface Rsvp {
  id: string;
  plan_id: string;
  member_id: string;
  status: RsvpStatus;
  created_at: string;
}

export interface Reaction {
  id: string;
  plan_id: string;
  member_id: string;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: string;
  plan_id: string;
  member_id: string;
  body: string;
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
  const { data, error } = await supabase.from("rsvps").select("*").in("plan_id", planIds);
  if (error) throw error;
  return (data as Rsvp[]) ?? [];
}

export async function fetchReactions(planIds: string[]): Promise<Reaction[]> {
  if (planIds.length === 0) return [];
  const { data, error } = await supabase.from("reactions").select("*").in("plan_id", planIds);
  if (error) throw error;
  return (data as Reaction[]) ?? [];
}

export async function fetchComments(planIds: string[]): Promise<Comment[]> {
  if (planIds.length === 0) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .in("plan_id", planIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Comment[]) ?? [];
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

export async function setConfirmed(planId: string, confirmed: boolean): Promise<void> {
  const { error } = await supabase.from("plans").update({ confirmed }).eq("id", planId);
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

// Toggle a member's emoji reaction on a plan.
export async function toggleReaction(
  planId: string,
  memberId: string,
  emoji: string,
  on: boolean
): Promise<void> {
  if (on) {
    const { error } = await supabase
      .from("reactions")
      .upsert(
        { plan_id: planId, member_id: memberId, emoji },
        { onConflict: "plan_id,member_id,emoji" }
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("plan_id", planId)
      .eq("member_id", memberId)
      .eq("emoji", emoji);
    if (error) throw error;
  }
}

export async function addComment(
  planId: string,
  memberId: string,
  body: string
): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .insert({ plan_id: planId, member_id: memberId, body: body.trim() });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export interface Venue {
  id: string;
  plan_id: string;
  name: string;
  created_at: string;
}

export interface VenueVote {
  id: string;
  venue_id: string;
  member_id: string;
  created_at: string;
}

export async function fetchVenues(planIds: string[]): Promise<Venue[]> {
  if (planIds.length === 0) return [];
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .in("plan_id", planIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Venue[]) ?? [];
}

export async function fetchVenueVotes(venueIds: string[]): Promise<VenueVote[]> {
  if (venueIds.length === 0) return [];
  const { data, error } = await supabase
    .from("venue_votes")
    .select("*")
    .in("venue_id", venueIds);
  if (error) throw error;
  return (data as VenueVote[]) ?? [];
}

export async function addVenue(planId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("venues")
    .insert({ plan_id: planId, name: name.trim() });
  if (error) throw error;
}

export async function deleteVenue(venueId: string): Promise<void> {
  const { error } = await supabase.from("venues").delete().eq("id", venueId);
  if (error) throw error;
}

// One vote per member per plan: clear this member's other votes on the plan,
// then record the new one (unless toggling the same venue off).
export async function voteVenue(
  planVenueIds: string[],
  venueId: string,
  memberId: string,
  on: boolean
): Promise<void> {
  if (planVenueIds.length > 0) {
    const { error: clearErr } = await supabase
      .from("venue_votes")
      .delete()
      .eq("member_id", memberId)
      .in("venue_id", planVenueIds);
    if (clearErr) throw clearErr;
  }
  if (on) {
    const { error } = await supabase
      .from("venue_votes")
      .insert({ venue_id: venueId, member_id: memberId });
    if (error) throw error;
  }
}
