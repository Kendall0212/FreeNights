import { useMemo, useState } from "react";
import {
  CalendarPlus,
  CalendarDays,
  Download,
  Trash2,
  Check,
  X,
  PartyPopper,
  Send,
  Plus,
} from "lucide-react";
import Avatar from "./Avatar";
import { prettyDate, todayKey, fromKey } from "../lib/dates";
import { SLOT_LABEL } from "../lib/types";
import { buildIcs, downloadIcs, googleCalUrl } from "../lib/ics";
import {
  createPlan,
  deletePlan,
  setRsvp,
  setConfirmed,
  toggleReaction,
  addComment,
  deleteComment,
  addVenue,
  voteVenue,
} from "../lib/plans";
import type { Slot, Group, Member } from "../lib/types";
import type { Plan, Rsvp, Reaction, Comment, Venue, VenueVote } from "../lib/plans";

interface Props {
  group: Group;
  me: Member;
  members: Member[];
  plans: Plan[];
  rsvps: Rsvp[];
  reactions: Reaction[];
  comments: Comment[];
  venues: Venue[];
  venueVotes: VenueVote[];
  onChanged: () => void;
}

const SLOT_OPTIONS: { value: "" | Slot; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const REACTION_EMOJIS = ["🎉", "❤️", "🔥", "👀", "🙌"];

function countdown(dateKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = fromKey(dateKey);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  if (diff === -1) return "yesterday";
  return `${-diff} days ago`;
}

export default function Plans({
  group,
  me,
  members,
  plans,
  rsvps,
  reactions,
  comments,
  venues,
  venueVotes,
  onChanged,
}: Props) {
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
      // realtime reconciles
    } finally {
      setBusy(false);
    }
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
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              me={me}
              memberById={memberById}
              rsvps={rsvps}
              reactions={reactions}
              comments={comments}
              venues={venues}
              venueVotes={venueVotes}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  plan: Plan;
  me: Member;
  memberById: Map<string, Member>;
  rsvps: Rsvp[];
  reactions: Reaction[];
  comments: Comment[];
  venues: Venue[];
  venueVotes: VenueVote[];
  onChanged: () => void;
}

function PlanCard({ plan, me, memberById, rsvps, reactions, comments, venues, venueVotes, onChanged }: CardProps) {
  const [draft, setDraft] = useState("");
  const [venueName, setVenueName] = useState("");

  const planVenues = venues.filter((v) => v.plan_id === plan.id);
  const planVenueIds = planVenues.map((v) => v.id);
  const myVoteVenueId =
    venueVotes.find((vv) => planVenueIds.includes(vv.venue_id) && vv.member_id === me.id)?.venue_id ?? null;

  const inMembers = rsvps
    .filter((r) => r.plan_id === plan.id && r.status === "in")
    .map((r) => memberById.get(r.member_id))
    .filter((m): m is Member => !!m);
  const mine = rsvps.find((r) => r.plan_id === plan.id && r.member_id === me.id)?.status ?? null;

  const planReactions = reactions.filter((r) => r.plan_id === plan.id);
  const planComments = comments.filter((c) => c.plan_id === plan.id);

  async function act(fn: () => Promise<void>) {
    try {
      await fn();
      onChanged();
    } catch {
      // realtime reconciles
    }
  }

  function toGoogle() {
    const title = plan.note ? `Girls' night — ${plan.note}` : "Girls' night";
    window.open(googleCalUrl(title, plan.date, plan.slot, plan.note), "_blank", "noopener");
  }
  function toApple() {
    const title = plan.note ? `Girls' night — ${plan.note}` : "Girls' night";
    downloadIcs("free-nights.ics", buildIcs(title, plan.date, plan.slot, plan.note));
  }

  async function postComment() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await act(() => addComment(plan.id, me.id, body));
  }

  async function addSpot() {
    const n = venueName.trim();
    if (!n) return;
    setVenueName("");
    await act(() => addVenue(plan.id, n));
  }

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card ${plan.confirmed ? "ring-2 ring-mulberry" : ""}`}>
      {plan.confirmed && (
        <div className="flex items-center gap-1.5 text-mulberry font-semibold text-sm mb-2">
          <PartyPopper size={16} />
          It's on! · {countdown(plan.date)}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-extrabold text-lg text-ink">{prettyDate(plan.date)}</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            {plan.slot ? SLOT_LABEL[plan.slot] : "Any time"}
          </p>
          {plan.note && <p className="text-ink mt-1.5">{plan.note}</p>}
        </div>
        <button
          onClick={() => act(() => deletePlan(plan.id))}
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
        <span className="font-mono text-[11px] text-muted ml-0.5">{inMembers.length} in</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => act(() => setRsvp(plan.id, me.id, "in"))}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
            mine === "in" ? "bg-mulberry text-white" : "bg-paper text-ink border border-mist"
          }`}
        >
          <Check size={15} /> I'm in
        </button>
        <button
          onClick={() => act(() => setRsvp(plan.id, me.id, "out"))}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
            mine === "out" ? "bg-ink text-white" : "bg-paper text-ink border border-mist"
          }`}
        >
          <X size={15} /> Can't make it
        </button>
      </div>

      <button
        onClick={() => act(() => setConfirmed(plan.id, !plan.confirmed))}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold mt-2 active:scale-95 transition ${
          plan.confirmed
            ? "bg-paper text-muted border border-mist"
            : "bg-ink text-white"
        }`}
      >
        {plan.confirmed ? "Unlock" : "Lock it in 🎉"}
      </button>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {REACTION_EMOJIS.map((e) => {
          const count = planReactions.filter((r) => r.emoji === e).length;
          const reacted = planReactions.some((r) => r.emoji === e && r.member_id === me.id);
          return (
            <button
              key={e}
              onClick={() => act(() => toggleReaction(plan.id, me.id, e, !reacted))}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition active:scale-90 ${
                reacted ? "bg-mulberry/15 ring-1 ring-mulberry" : "bg-paper border border-mist"
              }`}
            >
              <span>{e}</span>
              {count > 0 && <span className="font-mono text-[11px] text-muted">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1.5">Where?</p>
        {planVenues.length > 0 && (
          <div className="space-y-1.5">
            {planVenues.map((v) => {
              const count = venueVotes.filter((vv) => vv.venue_id === v.id).length;
              const mineV = myVoteVenueId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => act(() => voteVenue(planVenueIds, v.id, me.id, !mineV))}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition active:scale-[0.99] ${
                    mineV ? "bg-mulberry text-white" : "bg-paper text-ink border border-mist"
                  }`}
                >
                  <span className="truncate">{v.name}</span>
                  <span className="font-mono text-xs ml-2 shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSpot()}
            placeholder="Add a spot…"
            maxLength={60}
            className="flex-1 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-mulberry"
          />
          <button
            onClick={addSpot}
            disabled={!venueName.trim()}
            aria-label="Add spot"
            className="rounded-xl bg-ink p-2.5 text-white active:scale-95 disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={toGoogle}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist py-2.5 text-sm font-semibold text-mulberry active:scale-95"
        >
          <CalendarDays size={15} /> Google
        </button>
        <button
          onClick={toApple}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist py-2.5 text-sm font-semibold text-mulberry active:scale-95"
        >
          <Download size={15} /> Apple / .ics
        </button>
      </div>

      {planComments.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-mist pt-3">
          {planComments.map((c) => {
            const author = memberById.get(c.member_id);
            return (
              <div key={c.id} className="flex items-start gap-2">
                {author && (
                  <Avatar name={author.name} colour={author.colour} emoji={author.emoji} size={22} />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-ink text-sm">{author?.name ?? "Someone"}</span>{" "}
                  <span className="text-ink text-sm">{c.body}</span>
                </div>
                {c.member_id === me.id && (
                  <button
                    onClick={() => act(() => deleteComment(c.id))}
                    aria-label="Delete comment"
                    className="text-muted active:scale-95"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && postComment()}
          placeholder="Add a comment…"
          maxLength={140}
          className="flex-1 rounded-xl border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-mulberry"
        />
        <button
          onClick={postComment}
          disabled={!draft.trim()}
          aria-label="Send comment"
          className="rounded-xl bg-mulberry p-2.5 text-white active:scale-95 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
