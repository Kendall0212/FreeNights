import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchAvailability, fetchGroup, fetchMembers } from "../lib/data";
import type { Availability, Group, Member } from "../lib/types";

interface GroupState {
  group: Group | null;
  members: Member[];
  availability: Availability[];
  loading: boolean;
  notFound: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useGroup(shareCode: string | null): GroupState {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(!!shareCode);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shareCode) return;
    setLoading(true);
    setError(null);
    try {
      const g = await fetchGroup(shareCode);
      if (!g) {
        setNotFound(true);
        setGroup(null);
        return;
      }
      setNotFound(false);
      setGroup(g);
      const [m, a] = await Promise.all([
        fetchMembers(g.id),
        fetchAvailability(g.id),
      ]);
      setMembers(m);
      setAvailability(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong loading this group.");
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates: when anyone in this group changes members or availability,
  // refetch the affected slice.
  useEffect(() => {
    if (!group) return;
    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability", filter: `group_id=eq.${group.id}` },
        () => {
          void fetchAvailability(group.id).then(setAvailability);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `group_id=eq.${group.id}` },
        () => {
          void fetchMembers(group.id).then(setMembers);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [group]);

  return { group, members, availability, loading, notFound, error, reload: load };
}
