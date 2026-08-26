# Daily Digest

A static site that publishes a running archive of newsletter digests. A
[Claude Cowork](https://claude.ai) task reads newsletters from an inbox once
a day, summarizes them into a Markdown file, and drops it in `digests/`. This
repo turns that folder into a static HTML site and deploys it to Firebase
Hosting.

There's no server and no database — `digests/*.md` in, static `dist/*.html`
out, served as plain files.

## How it works

```
digests/*.md  →  npm run build  →  dist/*.html  →  firebase deploy
```

- **`digests/`** — one Markdown file per digest, written by the Cowork task.
  Not tracked in git (see [Why `digests/` isn't in git](#why-digests-isnt-in-git)
  below) and not read from anywhere else — whatever's on disk when you build
  is what gets published.
- **`npm run build`** (`src/build.ts`) — reads every file in `digests/`,
  renders each one to HTML (`src/render.ts`, using `marked` for Markdown),
  and writes the result to `dist/`: one page per digest at
  `dist/digest/<slug>.html`, a full listing at `dist/digests/index.html`,
  the latest digest duplicated as `dist/index.html` (so visitors land on
  today's content instead of an index they'd have to click through), and a
  `dist/404.html`. Static assets in `public/` (just `style.css`) are copied
  in as-is. The raw Markdown itself is never copied into `dist/` — only the
  rendered HTML is published.
- **`npm run deploy`** — runs `npm run build` then `firebase deploy --only
  hosting`, pushing the freshly-built `dist/` to Firebase Hosting.
- **`npm run watch:deploy`** — watches `digests/**/*.md` and runs
  `npm run deploy` whenever a file changes. This is what turns "Cowork task
  finishes" into "site is live" without a CI system in between — see
  [Keeping it running](#keeping-it-running).

## Setup

**Prerequisites:**
- Node.js and `npm`
- The Firebase CLI, installed via **Homebrew**, not npm:
  ```
  brew install firebase-cli
  ```
  (Not `npm install -g firebase-tools` — see the note in
  [Why Homebrew, not npm, for the Firebase CLI](#why-homebrew-not-npm-for-the-firebase-cli).)

**One-time setup:**
```
npm install
firebase login
```
`.firebaserc` already points at the Firebase project (`steve-newsletter-digest`),
so nothing else needs configuring — `firebase login` is the only step tied to
your machine.

## Developing locally

```
npm run dev
```

Builds the site, serves it via the Firebase Hosting emulator (so you're
previewing exactly what `cleanUrls` routing and the generated HTML will look
like in production, not just opening the files directly), and watches
`src/`, `digests/`, and `public/` — any change triggers a rebuild
automatically. Refresh the browser to see it.

## Deploying

```
npm run deploy
```

Rebuilds and pushes to Firebase Hosting. To have this happen automatically
whenever the Cowork task drops a new digest:

```
npm run watch:deploy
```

### Keeping it running

`npm run watch:deploy` is a long-running foreground process — it needs to be
kept alive independently of any one terminal session (e.g. a `launchd` agent
on macOS) so it survives reboots and keeps watching after you close the
terminal. That setup is machine-specific and isn't part of this repo.

## Before your first deploy

The `digests/` folder on disk (not tracked in git — see below) may still
contain digests generated before the Cowork prompt was updated to exclude
personal mailbox links. Check `prompt.md`'s change history / the digest
content itself before running `npm run deploy` for the first time — anything
in `digests/` at build time gets published as-is.

## Why `digests/` isn't in git

This is a personal preference, not a technical requirement — `.md` files
would work fine tracked in git. But the deploy pipeline doesn't need git for
digest content at all: whichever machine runs `npm run watch:deploy` builds
and deploys straight from its own local `digests/` folder. The equivalent
rendered content ends up in `dist/`, so tracking the source `.md` too would
just be duplication. If you want a backup/history of the raw digests, that's
a separate, manual `git add digests/` whenever you feel like it — it's just
not part of the automated pipeline.

## Why Homebrew, not npm, for the Firebase CLI

`npx -y firebase-tools@latest` (the command Firebase's own docs and its
Claude Code agent-skills plugin suggest) re-resolves and runs whatever the
npm registry's `latest` tag currently points to on *every single invocation*,
with no review window. That's the exact mechanism behind several real npm
supply-chain incidents — a compromised maintainer account publishes a
malicious version under an existing trusted package name, and anything
that always fetches `@latest` runs it within minutes. A Homebrew install
only changes version on an explicit `brew upgrade firebase-cli`, so there's
a deliberate human action between "a new version exists" and "I'm running
it."

## Project structure

```
src/
  digests.ts   — reads and sorts digests/*.md from disk
  render.ts    — renders a digest (or the index/404 page) to an HTML string
  build.ts     — the static site generator: digests/ → dist/
prompt.md      — the Cowork task prompt that generates digests/*.md
public/        — static assets copied into dist/ as-is (style.css)
firebase.json  — Firebase Hosting config (public dir, cleanUrls)
.firebaserc    — which Firebase project this deploys to
```
