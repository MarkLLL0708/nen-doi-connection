/**
 * Reveal flood colour that always contrasts with the block underneath:
 * ink on light/pastel blocks, ember on ink/plum, butter on ember/red.
 * "page" means the plain app background, which is light or dark by theme.
 */
export function floodFor(tone: string): string {
  const t = tone.replace("block-", "");
  if (t === "ember" || t === "tet") return "block-butter";
  if (t === "ink" || t === "plum" || t === "deep") return "block-ember";
  if (t === "page") return "flood-auto";
  return "block-ink"; // blush, butter, cream
}

/** Text colour to use once the flood has covered the screen. */
export function floodText(flood: string): string | undefined {
  if (flood === "flood-auto") return undefined; // the class itself sets the colour
  return `var(--on-${flood.replace("block-", "")})`;
}
