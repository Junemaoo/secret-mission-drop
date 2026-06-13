export function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
