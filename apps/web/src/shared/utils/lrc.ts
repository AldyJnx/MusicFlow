/**
 * Minimal LRC parser.
 *
 * Accepts the standard LRC line format:
 *   [mm:ss.xx] text
 *   [mm:ss]    text
 *
 * Supports multiple timestamps per line (rare but valid):
 *   [00:12.30][00:14.30] same line at two timestamps
 *
 * Ignores metadata tags like [ti:...], [ar:...], [al:...], [length:...].
 * Empty lines are kept (rendered as a blank spacer in the lyrics panel).
 */

export type LyricsLine = {
  /** Time in milliseconds from track start. */
  timeMs: number;
  text: string;
};

const TIMESTAMP_RE = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const META_TAG_RE = /^\[[a-zA-Z]+:[^\]]*\]\s*$/;
const OFFSET_TAG_RE = /^\[offset:([+-]?\d+)\]\s*$/i;

export function parseLrc(input: string | null | undefined): LyricsLine[] {
  if (!input) return [];

  const out: LyricsLine[] = [];
  const rawLines = input.split(/\r?\n/);
  let offsetMs = 0;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;
    const offsetMatch = line.match(OFFSET_TAG_RE);
    if (offsetMatch) {
      // LRC's optional offset tag is milliseconds and shifts every timestamp.
      offsetMs = Number(offsetMatch[1]);
      continue;
    }
    if (META_TAG_RE.test(line)) continue;

    const timestamps: number[] = [];
    let lastIndex = 0;
    TIMESTAMP_RE.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = TIMESTAMP_RE.exec(line)) !== null) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fractionRaw = match[3] ?? "0";
      // Normalize 2-digit centiseconds vs 3-digit milliseconds: '50' → 500ms.
      const fraction =
        fractionRaw.length === 3
          ? Number(fractionRaw)
          : Number(fractionRaw) * (fractionRaw.length === 1 ? 100 : 10);

      const totalMs = minutes * 60_000 + seconds * 1_000 + fraction;
      timestamps.push(totalMs);
      lastIndex = TIMESTAMP_RE.lastIndex;
    }

    if (timestamps.length === 0) continue;

    const text = line.slice(lastIndex).trim();
    for (const timeMs of timestamps) {
      out.push({ timeMs, text });
    }
  }

  return out
    .map((line) => ({ ...line, timeMs: Math.max(0, line.timeMs + offsetMs) }))
    .sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Returns the index of the line whose timestamp is the largest still ≤
 * positionMs. -1 if positionMs is before the first line.
 */
export function findCurrentLineIndex(
  lines: LyricsLine[],
  positionMs: number,
): number {
  if (lines.length === 0) return -1;
  if (positionMs < lines[0].timeMs) return -1;

  // Binary search — lyrics can be long (hundreds of lines) and this runs on
  // every playhead tick (~10Hz).
  let lo = 0;
  let hi = lines.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lines[mid].timeMs <= positionMs) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}
