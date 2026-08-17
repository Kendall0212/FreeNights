// Remembers which member this device is, per group, so a returning
// friend edits her own availability instead of creating a duplicate.
const KEY = "free-nights:identities";

type IdentityMap = Record<string, string>; // shareCode -> memberId

function read(): IdentityMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IdentityMap) : {};
  } catch {
    return {};
  }
}

function write(map: IdentityMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private mode) — app still works for this session
  }
}

export function getMemberId(shareCode: string): string | null {
  return read()[shareCode] ?? null;
}

export function setMemberId(shareCode: string, memberId: string): void {
  const map = read();
  map[shareCode] = memberId;
  write(map);
}

export function clearMemberId(shareCode: string): void {
  const map = read();
  delete map[shareCode];
  write(map);
}
