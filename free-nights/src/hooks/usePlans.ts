import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchPlans, fetchRsvps, fetchReactions, fetchComments } from "../lib/plans";
import type { Plan, Rsvp, Reaction, Comment } from "../lib/plans";

export function usePlans(groupId: string | null) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      const p = await fetchPlans(groupId);
      setPlans(p);
      const ids = p.map((x) => x.id);
      const [r, re, c] = await Promise.all([
        fetchRsvps(ids),
        fetchReactions(ids),
        fetchComments(ids),
      ]);
      setRsvps(r);
      setReactions(re);
      setComments(c);
    } catch {
      // realtime or the next load will reconcile
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`plans:${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans", filter: `group_id=eq.${groupId}` },
        () => void load()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, load]);

  return { plans, rsvps, reactions, comments, reloadPlans: load };
}
