export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Weeks (Mon-first) covering the given month, as a 2D grid of Date cells.
export function monthGrid(monthAnchor: Date): Date[][] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export function isPast(d: Date): boolean {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d < t;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function monthTitle(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function prettyDate(key: string): string {
  const d = fromKey(key);
  return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function makeShareCode(): string {
  let out = "";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}
