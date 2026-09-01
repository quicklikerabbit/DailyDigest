import { marked, Renderer } from "marked";
import { type DigestDetail, type DigestMeta, slugFor } from "./digests";

// Content links point to external newsletters/articles, so open them in a
// new tab rather than navigating away from the digest.
marked.use({
  renderer: {
    link(this: Renderer, token: Parameters<Renderer["link"]>[0]) {
      const html = Renderer.prototype.link.call(this, token);
      return typeof html === "string"
        ? html.replace("<a ", '<a target="_blank" rel="noopener noreferrer" ')
        : html;
    },
  },
});

const FULL_STORY_INDEX_HEADING = /^##\s+.*FULL STORY INDEX.*$/im;

function splitFullStoryIndex(markdown: string): {
  main: string;
  storyIndex: string | null;
} {
  const match = markdown.match(FULL_STORY_INDEX_HEADING);
  if (!match || match.index === undefined) {
    return { main: markdown, storyIndex: null };
  }
  return {
    main: markdown.slice(0, match.index),
    storyIndex: markdown.slice(match.index + match[0].length),
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function navLink(
  label: string,
  digest: DigestMeta | null,
  direction: "prev" | "next",
): string {
  if (!digest) return `<span class="nav-link nav-disabled">${label}</span>`;
  return `<a class="nav-link nav-${direction}" href="/digest/${encodeURIComponent(slugFor(digest.filename))}">${label}</a>`;
}

function siteHeader(): string {
  return `<header class="site-header">
  <a class="site-title" href="/digests">Daily Digest</a>
</header>`;
}

export function renderDigestPage(digest: DigestDetail): string {
  const { main, storyIndex } = splitFullStoryIndex(digest.content);
  const mainHtml = marked.parse(main, { async: false });
  const storyIndexHtml = storyIndex
    ? marked.parse(storyIndex, { async: false })
    : null;
  const bodyHtml =
    mainHtml +
    (storyIndexHtml
      ? `<details class="story-index"><summary>📋 Full Story Index</summary>${storyIndexHtml}</details>`
      : "");

  const page = `
<div class="page-header">
${siteHeader()}
<nav class="digest-nav">
  ${navLink("&larr; Older", digest.prev, "prev")}
  <a class="nav-link nav-index" href="/digests">All digests</a>
  ${navLink("Newer &rarr;", digest.next, "next")}
</nav>
</div>
<main class="digest-content">
  <p class="digest-date">${escapeHtml(formatDate(digest.date))}</p>
  ${bodyHtml}
</main>
<nav class="digest-nav digest-nav-bottom">
  ${navLink("&larr; Older", digest.prev, "prev")}
  ${navLink("Newer &rarr;", digest.next, "next")}
</nav>
`;

  return pageShell(digest.title, page);
}

export function renderIndexPage(digests: DigestMeta[]): string {
  const items = digests
    .map(
      (d) => `
    <li>
      <a href="/digest/${encodeURIComponent(slugFor(d.filename))}">${escapeHtml(d.title)}</a>
      <span class="index-date">${escapeHtml(formatDate(d.date))}</span>
    </li>`,
    )
    .join("");

  const page = `
<div class="page-header">
${siteHeader()}
</div>
<main class="index-content">
  <h1>All digests</h1>
  <ul class="digest-list">${items}</ul>
</main>
`;

  return pageShell("All digests", page);
}

export function renderNotFoundPage(): string {
  const page = `
<div class="page-header">
${siteHeader()}
</div>
<main class="index-content">
  <h1>Not found</h1>
  <p>That page doesn't exist.</p>
  <p><a href="/digests">Back to all digests</a></p>
</main>
`;
  return pageShell("Not found", page);
}
