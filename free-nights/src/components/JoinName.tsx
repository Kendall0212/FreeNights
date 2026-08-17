import { useState } from "react";
import { addMember } from "../lib/data";
import Avatar from "./Avatar";
import type { Group, Member } from "../lib/types";

interface Props {
  group: Group;
  members: Member[];
  onJoined: (member: Member) => void;
}

export default function JoinName({ group, members, onJoined }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const member = await addMember(group.id, trimmed, members);
      onJoined(member);
    } catch {
      setError("Couldn't add you just now. Try again in a sec.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        {group.name}
      </p>
      <h2 className="font-display font-extrabold text-3xl mt-1 text-ink">Who are you?</h2>
      <p className="text-muted mt-2">
        Pick your name so your free times save to you.
      </p>

      {members.length > 0 && (
        <div className="mt-6 space-y-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onJoined(m)}
              className="w-full flex items-center gap-3 rounded-2xl border border-mist bg-white px-4 py-3 text-left active:scale-[0.99] transition hover:border-mulberry/40"
            >
              <Avatar name={m.name} colour={m.colour} size={34} />
              <span className="font-semibold text-ink">{m.name}</span>
            </button>
          ))}
          <p className="text-muted text-sm pt-2">Not listed? Add yourself below.</p>
        </div>
      )}

      <div className="mt-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Your name"
          maxLength={30}
          className="w-full rounded-2xl border border-mist bg-white px-4 py-3.5 text-lg outline-none focus:border-mulberry focus:ring-2 focus:ring-mulberry/20"
        />
        {error && <p className="text-mulberry-deep text-sm mt-2">{error}</p>}
        <button
          onClick={add}
          disabled={!name.trim() || busy}
          className="mt-3 w-full rounded-2xl bg-mulberry py-4 text-lg font-semibold text-white shadow-glow active:scale-[0.99] transition disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Adding…" : "That's me"}
        </button>
      </div>
    </div>
  );
}
