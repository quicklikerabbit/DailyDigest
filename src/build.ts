import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDigestByFilename, listDigests, slugFor } from "./digests";
import {
  renderDigestPage,
  renderIndexPage,
  renderNotFoundPage,
} from "./render";

const OUTPUT_DIR = path.join(process.cwd(), "dist");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function resetOutputDir(): void {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function copyStaticAssets(): void {
  if (existsSync(PUBLIC_DIR)) {
    cpSync(PUBLIC_DIR, OUTPUT_DIR, { recursive: true });
  }
}

function build(): void {
  resetOutputDir();
  copyStaticAssets();

  const digests = listDigests();

  const digestsDir = path.join(OUTPUT_DIR, "digests");
  mkdirSync(digestsDir, { recursive: true });
  writeFileSync(path.join(digestsDir, "index.html"), renderIndexPage(digests));

  const digestDir = path.join(OUTPUT_DIR, "digest");
  mkdirSync(digestDir, { recursive: true });

  let latestPageHtml: string | null = null;
  for (const meta of digests) {
    const digest = getDigestByFilename(meta.filename);
    if (!digest) continue;
    const pageHtml = renderDigestPage(digest);
    writeFileSync(
      path.join(digestDir, `${slugFor(digest.filename)}.html`),
      pageHtml,
    );
    if (latestPageHtml === null) latestPageHtml = pageHtml; // digests are sorted newest-first
  }

  // Homepage is the latest digest so visitors land on today's content
  // instead of an index they'd have to click through.
  writeFileSync(
    path.join(OUTPUT_DIR, "index.html"),
    latestPageHtml ?? renderIndexPage([]),
  );

  writeFileSync(path.join(OUTPUT_DIR, "404.html"), renderNotFoundPage());

  console.log(`Built ${digests.length} digest page(s) to ${OUTPUT_DIR}`);
}

build();
