// Curated so any two members stay easy to tell apart.
export const MEMBER_COLOURS = [
  "#B24468", // mulberry
  "#5F9EC0", // dawn blue
  "#E0982A", // amber
  "#5FA88C", // sage
  "#8A5AA6", // dusk violet
  "#D46A5A", // coral
  "#6C7BC0", // periwinkle
  "#C4568F", // rose
  "#4C9AA6", // teal
  "#9A7B3F", // ochre
];

export function nextColour(taken: string[]): string {
  const free = MEMBER_COLOURS.find((c) => !taken.includes(c));
  if (free) return free;
  return MEMBER_COLOURS[taken.length % MEMBER_COLOURS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
