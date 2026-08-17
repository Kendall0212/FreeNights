import { useState } from "react";
import { Share2, Check } from "lucide-react";
import Avatar from "./Avatar";
import type { Group, Member } from "../lib/types";

interface Props {
  group: Group;
  me: Member | null;
}

export default function Header({ group, me }: Props) {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}${window.location.pathname}?g=${group.share_code}`;

  async function share() {
    const payload = {
      title: `${group.name} · Free Nights`,
      text: `Add when you're free so we can pick a night — ${group.name}`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // user dismissed the share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to share:", link);
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-mist">
      <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Free Nights
          </p>
          <h1 className="font-display font-extrabold text-xl leading-tight truncate text-ink">
            {group.name}
          </h1>
        </div>
        {me && <Avatar name={me.name} colour={me.colour} size={30} />}
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white active:scale-95 transition"
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    </header>
  );
}
