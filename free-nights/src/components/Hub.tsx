import { useState } from "react";
import { Moon, ChevronRight, X } from "lucide-react";
import { createGroup } from "../lib/data";
import { listGroups, rememberGroup, forgetGroup } from "../lib/storage";
import { SLOT_COLOUR } from "../lib/types";
import type { SavedGroup } from "../lib/storage";

interface Props {
  onOpen: (code: string) => void;
}

export default function Hub({ onOpen }: Props) {
  const [groups, setGroups] = useState<SavedGroup[]>(() => listGroups());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const g = await createGroup(trimmed);
      rememberGroup(g.share_code, g.name);
      onOpen(g.share_code);
    } catch {
      setError("Couldn't create that group. Check your connection and try again.");
      setBusy(false);
    }
  }

  function remove(code: string) {
    forgetGroup(code);
    setGroups(listGroups());
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div
        className="px-6 pb-10 pt-16 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #F0A98C 0%, #D46A7E 55%, #8A5AA6 100%)",
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
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/70">Free Nights</p>
        <h1 className="font-display font-extrabold text-4xl leading-[1.05] mt-2">
          Find the night
          <br />
          everyone's free.
        </h1>
        <p className="text-white/85 mt-3 max-w-xs">
          A separate space for each of your crews — make one, share its link.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md px-6 py-8 flex-1">
        {groups.length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Your groups
            </p>
            <div className="space-y-2">
              {groups.map((g) => (
                <div
                  key={g.code}
                  className="flex items-center gap-2 rounded-2xl border border-mist bg-white px-4 py-3.5 shadow-card"
                >
                  <button
                    onClick={() => onOpen(g.code)}
                    className="flex-1 flex items-center justify-between text-left active:scale-[0.99] transition"
                  >
                    <span className="font-semibold text-ink truncate">{g.name}</span>
                    <ChevronRight size={18} className="text-muted shrink-0" />
                  </button>
                  <button
                    onClick={() => remove(g.code)}
                    aria-label={`Remove ${g.name} from this list`}
                    className="text-mist hover:text-muted active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-muted text-xs mt-2">
              Removing only hides it here — it won't delete the group.
            </p>
          </div>
        )}

        <label className="block font-semibold text-ink mb-2" htmlFor="group-name">
          {groups.length > 0 ? "Start another group" : "Name your first group"}
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
          You'll get a link to send. No accounts — anyone with the link can join.
        </p>
      </div>
    </div>
  );
}
