import type { Slot } from "./types";

// Floating local times per slot (no timezone suffix, so calendars read them
// as the reader's local time).
const SLOT_TIMES: Record<Slot, [string, string]> = {
  morning: ["100000", "120000"],
  afternoon: ["130000", "170000"],
  evening: ["190000", "230000"],
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(
  title: string,
  dateKey: string,
  slot: Slot | null,
  note: string | null
): string {
  const [y, m, d] = dateKey.split("-");
  const uid = `${dateKey}-${slot ?? "allday"}-${Math.random().toString(36).slice(2)}@freenights`;
  const stamp = utcStamp(new Date());

  let start: string;
  let end: string;
  const allDay = !slot;

  if (slot) {
    const [s, e] = SLOT_TIMES[slot];
    start = `${y}${m}${d}T${s}`;
    end = `${y}${m}${d}T${e}`;
  } else {
    start = `${y}${m}${d}`;
    const next = new Date(Number(y), Number(m) - 1, Number(d) + 1);
    end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Free Nights//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcs(title)}`,
    note ? `DESCRIPTION:${escapeIcs(note)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
