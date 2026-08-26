import { marked } from "marked";
import { type DigestDetail, type DigestMeta, slugFor } from "./digests";

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

export function renderDigestPage(digest: DigestDetail): string {
  const bodyHtml = marked.parse(digest.content, { async: false });

  const page = `
<header class="site-header">
  <a class="site-title" href="/digests">Daily Digest</a>
</header>
<nav class="digest-nav">
  ${navLink("&larr; Older", digest.prev, "prev")}
  <a class="nav-link nav-index" href="/digests">All digests</a>
  ${navLink("Newer &rarr;", digest.next, "next")}
</nav>
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
<header class="site-header">
  <a class="site-title" href="/digests">Daily Digest</a>
</header>
<main class="index-content">
  <h1>All digests</h1>
  <ul class="digest-list">${items}</ul>
</main>
`;

  return pageShell("All digests", page);
}

export function renderNotFoundPage(): string {
  const page = `
<header class="site-header">
  <a class="site-title" href="/digests">Daily Digest</a>
</header>
<main class="index-content">
  <h1>Not found</h1>
  <p>That page doesn't exist.</p>
  <p><a href="/digests">Back to all digests</a></p>
</main>
`;
  return pageShell("Not found", page);
}
