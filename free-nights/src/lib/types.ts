export type Slot = "morning" | "afternoon" | "evening";
export type Status = "free" | "maybe" | "busy";

export interface Group {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  colour: string;
  emoji: string | null;
  created_at: string;
}

export interface Availability {
  id: string;
  group_id: string;
  member_id: string;
  date: string; // yyyy-mm-dd
  slot: Slot;
  status: Status;
  created_at: string;
}

export const SLOTS: Slot[] = ["morning", "afternoon", "evening"];

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const SLOT_HINT: Record<Slot, string> = {
  morning: "before noon",
  afternoon: "12–5pm",
  evening: "after 5pm",
};

// Each slot owns a colour, carried through the whole app.
export const SLOT_COLOUR: Record<Slot, string> = {
  morning: "#5F9EC0",
  afternoon: "#E0982A",
  evening: "#8A5AA6",
};

export const STATUS_LABEL: Record<Status, string> = {
  free: "Free",
  maybe: "Maybe",
  busy: "Busy",
};

// Fun identity emojis friends pick when they join.
export const EMOJI_CHOICES = [
  "🌙", "✨", "🍸", "💃", "🎉", "🌸", "🦋", "🍕",
  "🎀", "🔥", "🌈", "⭐", "🥂", "🌻", "🍾", "🐝",
];
