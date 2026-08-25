import { useState } from "react";
import { Share2, Check, MessageSquare } from "lucide-react";
import Avatar from "./Avatar";
import type { Member } from "../lib/types";

interface Props {
  me: Member | null;
  groupName: string;
  onHome: () => void;
}

// Opens the phone's Messages app with the text pre-filled (works on iOS + Android).
function smsHref(body: string): string {
  return `sms:?&body=${encodeURIComponent(body)}`;
}

export default function Header({ me, groupName, onHome }: Props) {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const nudge = `girls' night sorting 🌙 tap when you're free and we'll find a night that works 👉 ${link}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Free Nights", text: nudge, url: link });
        return;
      } catch {
        // dismissed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(nudge);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this to send to the group:", nudge);
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-mist">
      <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-2">
        <button onClick={onHome} className="min-w-0 flex-1 text-left active:scale-[0.99] transition">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Free Nights
          </p>
          <h1 className="font-display font-extrabold text-xl leading-tight truncate text-ink">
            {groupName}
          </h1>
        </button>
        {me && <Avatar name={me.name} colour={me.colour} emoji={me.emoji} size={30} />}
        <a
          href={smsHref(nudge)}
          aria-label="Text the group"
          className="inline-flex items-center justify-center rounded-full bg-mulberry p-2.5 text-white active:scale-95 transition"
        >
          <MessageSquare size={16} />
        </a>
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white active:scale-95 transition"
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? "Copied" : "Invite"}
        </button>
      </div>
    </header>
  );
}
