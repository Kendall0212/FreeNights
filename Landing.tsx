import { useState } from "react";
import { Moon } from "lucide-react";
import { createGroup } from "../lib/data";
import type { Group } from "../lib/types";
import { SLOT_COLOUR } from "../lib/types";

interface Props {
  onCreated: (group: Group) => void;
}

export default function Landing({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const group = await createGroup(trimmed);
      onCreated(group);
    } catch {
      setError("Couldn't create the group. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div
        className="flex-1 flex flex-col justify-end px-6 pb-10 pt-16 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #3A2A52 0%, #6B3E6E 55%, #B24468 100%)",
        }}
      >
        <div className="absolute right-6 top-10 opacity-90">
          <Moon size={40} strokeWidth={1.5} />
        </div>
        <div className="flex gap-1.5 mb-6">
          <span className="h-1.5 w-10 rounded-full" style={{ background: SLOT_COLOUR.morning }} />
          <span className="h-1.5 w-10 rounded-full" style={{ background: SLOT_COLOUR.afternoon }} />
          <span className="h-1.5 w-10 rounded-full" style={{ background: SLOT_COLOUR.evening }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/70">
          Free Nights
        </p>
        <h1 className="font-display font-extrabold text-4xl leading-[1.05] mt-2">
          Find the night
          <br />
          everyone's free.
        </h1>
        <p className="text-white/80 mt-3 max-w-xs">
          Start a group, share one link, and watch the best times light up.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md px-6 py-8">
        <label className="block font-semibold text-ink mb-2" htmlFor="group-name">
          Name your group
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="e.g. Friday Girls"
          maxLength={40}
          className="w-full rounded-2xl border border-mist bg-white px-4 py-3.5 text-lg outline-none focus:border-mulberry focus:ring-2 focus:ring-mulberry/20"
        />
        {error && <p className="text-mulberry-deep text-sm mt-2">{error}</p>}
        <button
          onClick={create}
          disabled={!name.trim() || busy}
          className="mt-4 w-full rounded-2xl bg-mulberry py-4 text-lg font-semibold text-white shadow-glow active:scale-[0.99] transition disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Creating…" : "Create group"}
        </button>
        <p className="text-muted text-sm mt-4 text-center">
          No accounts. Anyone with the link can join.
        </p>
      </div>
    </div>
  );
}
