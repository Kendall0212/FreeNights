import { useState } from "react";
import { addMember } from "../lib/data";
import { nextEmoji } from "../lib/colours";
import { EMOJI_CHOICES } from "../lib/types";
import Avatar from "./Avatar";
import type { Group, Member } from "../lib/types";

interface Props {
  group: Group;
  members: Member[];
  onJoined: (member: Member) => void;
}

export default function JoinName({ group, members, onJoined }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(() => nextEmoji(members.map((m) => m.emoji)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const member = await addMember(group.id, trimmed, members, emoji);
      onJoined(member);
    } catch {
      setError("Couldn't add you just now. Try again in a sec.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        Free Nights
      </p>
      <h2 className="font-display font-extrabold text-3xl mt-1 text-ink">Who are you?</h2>
      <p className="text-muted mt-2">Tap your name, or add yourself below.</p>

      {members.length > 0 && (
        <div className="mt-6 space-y-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onJoined(m)}
              className="w-full flex items-center gap-3 rounded-2xl border border-mist bg-white px-4 py-3 text-left active:scale-[0.99] transition hover:border-mulberry/40"
            >
              <Avatar name={m.name} colour={m.colour} emoji={m.emoji} size={34} />
              <span className="font-semibold text-ink">{m.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-white p-4 shadow-card">
        <p className="font-semibold text-ink mb-3">New here? Add yourself</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Your name"
          maxLength={30}
          className="w-full rounded-2xl border border-mist bg-paper px-4 py-3.5 text-lg outline-none focus:border-mulberry focus:ring-2 focus:ring-mulberry/20"
        />

        <p className="text-muted text-sm mt-4 mb-2">Pick your emoji</p>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`aspect-square rounded-xl text-xl flex items-center justify-center transition active:scale-90 ${
                emoji === e ? "bg-mulberry/15 ring-2 ring-mulberry" : "bg-paper"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {error && <p className="text-mulberry-deep text-sm mt-3">{error}</p>}
        <button
          onClick={add}
          disabled={!name.trim() || busy}
          className="mt-4 w-full rounded-2xl bg-mulberry py-4 text-lg font-semibold text-white shadow-glow active:scale-[0.99] transition disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Adding…" : "That's me"}
        </button>
      </div>
    </div>
  );
}
