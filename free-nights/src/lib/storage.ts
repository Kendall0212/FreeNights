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

// Remembers the groups this device has created or joined, so the home
// screen can list them for quick switching.
const GROUPS_KEY = "free-nights:groups";

export interface SavedGroup {
  code: string;
  name: string;
}

function readGroups(): SavedGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? (JSON.parse(raw) as SavedGroup[]) : [];
  } catch {
    return [];
  }
}

export function listGroups(): SavedGroup[] {
  return readGroups();
}

export function rememberGroup(code: string, name: string): void {
  try {
    const groups = readGroups().filter((g) => g.code !== code);
    groups.unshift({ code, name });
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups.slice(0, 20)));
  } catch {
    // storage unavailable — non-fatal
  }
}

export function forgetGroup(code: string): void {
  try {
    localStorage.setItem(
      GROUPS_KEY,
      JSON.stringify(readGroups().filter((g) => g.code !== code))
    );
  } catch {
    // non-fatal
  }
}
