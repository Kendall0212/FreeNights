import { useMemo, useState } from "react";
import { CalendarPlus, Download, Trash2, Check, X, CalendarDays } from "lucide-react";
import Avatar from "./Avatar";
import { prettyDate, todayKey } from "../lib/dates";
import { SLOT_LABEL } from "../lib/types";
import { buildIcs, downloadIcs, googleCalUrl } from "../lib/ics";
import { createPlan, deletePlan, setRsvp } from "../lib/plans";
import type { Slot, Group, Member } from "../lib/types";
import type { Plan, Rsvp } from "../lib/plans";

interface Props {
  group: Group;
  me: Member;
  members: Member[];
  plans: Plan[];
  rsvps: Rsvp[];
  onChanged: () => void;
}

const SLOT_OPTIONS: { value: "" | Slot; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export default function Plans({ group, me, members, plans, rsvps, onChanged }: Props) {
  const [proposing, setProposing] = useState(false);
  const [pdate, setPdate] = useState(todayKey());
  const [pslot, setPslot] = useState<"" | Slot>("evening");
  const [pnote, setPnote] = useState("");
  const [busy, setBusy] = useState(false);

  const memberById = useMemo(() => {
    const m = new Map<string, Member>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  async function propose() {
    if (!pdate || busy) return;
    setBusy(true);
    try {
      const plan = await createPlan(group.id, pdate, pslot || null, pnote || null, me.id);
      await setRsvp(plan.id, me.id, "in");
      setProposing(false);
      setPnote("");
      onChanged();
    } catch {
      // no-op; realtime reconciles
    } finally {
      setBusy(false);
    }
  }

  async function rsvp(planId: string, status: "in" | "out") {
    try {
      await setRsvp(planId, me.id, status);
      onChanged();
    } catch {
      // no-op
    }
  }

  async function remove(planId: string) {
    try {
      await deletePlan(planId);
      onChanged();
    } catch {
      // no-op
    }
  }

  function planTitle(plan: Plan) {
    return plan.note ? `Girls' night — ${plan.note}` : "Girls' night";
  }
  function toGoogle(plan: Plan) {
    window.open(googleCalUrl(planTitle(plan), plan.date, plan.slot, plan.note), "_blank", "noopener");
  }
  function toApple(plan: Plan) {
    downloadIcs("free-nights.ics", buildIcs(planTitle(plan), plan.date, plan.slot, plan.note));
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-extrabold text-2xl text-ink">Plans</h2>
        {!proposing && (
          <button
            onClick={() => setProposing(true)}
            className="inline-flex items-center gap-2 rounded-full bg-mulberry px-3.5 py-2 text-sm font-semibold text-white shadow-glow active:scale-95"
          >
            <CalendarPlus size={16} />
            Propose a night
          </button>
        )}
      </div>

      {proposing && (
        <div className="rounded-3xl bg-white p-4 shadow-card mb-5">
          <input
            type="date"
            value={pdate}
            min={todayKey()}
            onChange={(e) => setPdate(e.target.value)}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-ink outline-none focus:border-mulberry"
          />
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {SLOT_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => setPslot(o.value)}
                className={`rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${
                  pslot === o.value ? "bg-mulberry text-white" : "bg-paper text-ink border border-mist"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <input
            value={pnote}
            onChange={(e) => setPnote(e.target.value)}
            placeholder="Add a note (e.g. dinner at Via Porta?)"
            maxLength={80}
            className="w-full rounded-xl border border-mist bg-paper px-3 py-2.5 mt-3 outline-none focus:border-mulberry"
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setProposing(false)}
              className="rounded-xl border border-mist py-2.5 text-sm font-semibold text-muted active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={propose}
              disabled={!pdate || busy}
              className="rounded-xl bg-mulberry py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-40"
            >
              {busy ? "Proposing…" : "Propose"}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 && !proposing ? (
        <div className="py-14 text-center">
          <CalendarPlus className="mx-auto text-muted mb-3" size={28} />
          <h3 className="font-display font-extrabold text-xl text-ink">No plans yet</h3>
          <p className="text-muted mt-2">
            Found a night that works? Propose it and everyone can RSVP.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const planRsvps = rsvps.filter((r) => r.plan_id === plan.id);
            const inMembers = planRsvps
              .filter((r) => r.status === "in")
              .map((r) => memberById.get(r.member_id))
              .filter((m): m is Member => !!m);
            const mine = planRsvps.find((r) => r.member_id === me.id)?.status ?? null;

            return (
              <div key={plan.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-lg text-ink">
                      {prettyDate(plan.date)}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                      {plan.slot ? SLOT_LABEL[plan.slot] : "Any time"}
                    </p>
                    {plan.note && <p className="text-ink mt-1.5">{plan.note}</p>}
                  </div>
                  <button
                    onClick={() => remove(plan.id)}
                    aria-label="Remove plan"
                    className="rounded-full p-1.5 text-muted hover:text-mulberry-deep active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3 min-h-[24px]">
                  {inMembers.map((m) => (
                    <Avatar key={m.id} name={m.name} colour={m.colour} emoji={m.emoji} size={24} />
                  ))}
                  <span className="font-mono text-[11px] text-muted ml-0.5">
                    {inMembers.length} in
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => rsvp(plan.id, "in")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
                      mine === "in" ? "bg-mulberry text-white" : "bg-paper text-ink border border-mist"
                    }`}
                  >
                    <Check size={15} /> I'm in
                  </button>
                  <button
                    onClick={() => rsvp(plan.id, "out")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
                      mine === "out" ? "bg-ink text-white" : "bg-paper text-ink border border-mist"
                    }`}
                  >
                    <X size={15} /> Can't make it
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => toGoogle(plan)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist py-2.5 text-sm font-semibold text-mulberry active:scale-95"
                  >
                    <CalendarDays size={15} /> Google
                  </button>
                  <button
                    onClick={() => toApple(plan)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist py-2.5 text-sm font-semibold text-mulberry active:scale-95"
                  >
                    <Download size={15} /> Apple / .ics
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
