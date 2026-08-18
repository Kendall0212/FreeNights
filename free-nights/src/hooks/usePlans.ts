import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchPlans, fetchRsvps } from "../lib/plans";
import type { Plan, Rsvp } from "../lib/plans";

export function usePlans(groupId: string | null) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      const p = await fetchPlans(groupId);
      setPlans(p);
      const r = await fetchRsvps(p.map((x) => x.id));
      setRsvps(r);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvps" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, load]);

  return { plans, rsvps, reloadPlans: load };
}
