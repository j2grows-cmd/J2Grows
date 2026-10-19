const ARTWORK_RULES: Array<{ matches: string[]; artwork: string }> = [
  { matches: ["alocasia", "elephant-ear"], artwork: "alocasia" },
  { matches: ["monstera", "rhaphidophora"], artwork: "monstera" },
  { matches: ["philodendron", "epipremnum", "pothos", "scindapsus"], artwork: "philodendron" },
  { matches: ["anthurium", "syngonium"], artwork: "anthurium" },
  { matches: ["dragon-scale", "dragon_scale"], artwork: "dragon" },
  { matches: ["pink-princess", "pink_princess", "pink"], artwork: "pink" },
];

/** Return an existing CSS botanical illustration key based on the species slug/name. */
export function getFallbackArtworkType(identifier: string): string {
  const normalized = identifier.trim().toLowerCase().replace(/\s+/g, "-");
  const match = ARTWORK_RULES.find((rule) => rule.matches.some((token) => normalized.includes(token)));
  return match?.artwork ?? "hero";
}

/** Prefer an image URL, then a known local artwork key, then a genus/category fallback. */
export function resolvePlantArtwork(image: string | null | undefined, identifier: string, localArtwork?: string | null): string {
  if (typeof image === "string" && /^https?:\/\//i.test(image.trim())) return image.trim();
  if (typeof localArtwork === "string" && localArtwork.trim()) return localArtwork.trim();
  return getFallbackArtworkType(identifier);
}
