import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DIGESTS_DIR =
  process.env.DIGESTS_DIR ?? path.join(process.cwd(), "digests");

const DATE_IN_FILENAME = /(\d{4})-(\d{2})-(\d{2})/;

export interface DigestMeta {
  filename: string;
  title: string;
  date: Date | null;
  mtimeMs: number;
}

export interface DigestDetail extends DigestMeta {
  content: string;
  prev: DigestMeta | null; // older
  next: DigestMeta | null; // newer
}

function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(DATE_IN_FILENAME);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractTitle(content: string, filename: string): string {
  const heading = content
    .split("\n")
    .find((line) => line.trim().startsWith("# "));
  if (heading) return heading.replace(/^#\s+/, "").trim();
  return path
    .basename(filename, ".md")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugFor(filename: string): string {
  return path.basename(filename, ".md");
}

/**
 * Re-reads the digests directory on every call (no caching) so newly
 * dropped-in files show up without re-running the build. Returns an empty
 * list rather than throwing if the folder doesn't exist yet (e.g. a fresh
 * clone before the first digest has been produced).
 */
export function listDigests(): DigestMeta[] {
  if (!existsSync(DIGESTS_DIR)) return [];

  const filenames = readdirSync(DIGESTS_DIR).filter((f) => f.endsWith(".md"));

  const digests = filenames.map((filename) => {
    const fullPath = path.join(DIGESTS_DIR, filename);
    const content = readFileSync(fullPath, "utf-8");
    const stats = statSync(fullPath);
    return {
      filename,
      title: extractTitle(content, filename),
      date: parseDateFromFilename(filename),
      mtimeMs: stats.mtimeMs,
    };
  });

  digests.sort((a, b) => {
    const dateDiff = (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);
    if (dateDiff !== 0) return dateDiff;
    return b.mtimeMs - a.mtimeMs;
  });

  return digests;
}

export function getDigestByFilename(filename: string): DigestDetail | null {
  const digests = listDigests();
  const index = digests.findIndex((d) => d.filename === filename);
  if (index === -1) return null;

  const fullPath = path.join(DIGESTS_DIR, filename);
  const content = readFileSync(fullPath, "utf-8");

  return {
    ...digests[index],
    content,
    prev: digests[index + 1] ?? null, // older
    next: digests[index - 1] ?? null, // newer
  };
}
