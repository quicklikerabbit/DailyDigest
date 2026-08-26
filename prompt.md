## Newsletter Digest — Evening Run (7PM)

Your job is to produce a curated evening newsletter digest for Steve, a software engineer specializing in web development whose primary clients are in the natural resource sector (mining, oil & gas, forestry, agriculture, energy, environmental management, etc.).

### Step 1: Fetch newsletters

Use the Microsoft 365 Outlook email search tool (`outlook_email_search`) to retrieve all emails from the **"Newsletters"** folder received in the **last 24 hours**. Use these parameters:
- `folderName`: "Newsletters"
- `afterDateTime`: "24 hours ago"
- `limit`: 50

### Step 2: Create the digest file early

**Before reading any email bodies**, create a skeleton digest file at the save path (see Step 4) using `mcp__workspace__bash`. Write a header, today's date, a list of newsletters found, and placeholder sections. This ensures a partial digest exists even if the session runs out of context before you finish. Fill in each section as you process newsletters — do not wait until the end to write everything at once.

### Step 3: Read full content

For each email returned, use the `read_resource` tool with the email's `uri` to fetch the full body.

**Handling oversized emails (very important):**
Some emails are too large to return inline. When this happens, `read_resource` will return a message like:
> "Result too large ... saved to `/var/folders/kt/.../tool-results/mcp-...-read_resource-*.txt`"

When you see this pattern, **immediately** spin up a subagent using the `Agent` tool to read and extract the content. Do not defer this to later — temp files only exist for the current session and will be lost if context runs out. Pass the subagent the exact file path and these instructions:

> This file is a saved newsletter email (may be raw JSON with an HTML body, or plain HTML). Your job is to extract ALL story content — every headline, summary, and bullet — from it.
>
> **Step 1 — Strip HTML to plaintext** using python3 in bash. This preserves each link's real URL as a `[LINK:...]` marker right next to its text *before* stripping tags — without this, hrefs are lost entirely and there's nothing but the email's own link to fall back on:
> ```
> python3 -c "
> import json, re
> raw = open('PATH', encoding='utf-8', errors='replace').read()
> try:
>     data = json.loads(raw)
>     html = data['body']['content']
> except Exception:
>     html = raw
> def tag_link(m):
>     return f'{m.group(2)} [LINK:{m.group(1)}]'
> html = re.sub(r'<a\s+[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>', tag_link, html, flags=re.IGNORECASE | re.DOTALL)
> text = re.sub(r'<[^>]+>', ' ', html)
> text = re.sub(r'[ \t]+', ' ', text)
> lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 20]
> print('\n'.join(lines))
> "
> ```
>
> **Step 2 — If the plaintext output is very long** (>50,000 chars), slice it in ~60,000-char spans and process each span.
>
> **Step 3 — Extract and return ALL of the following**, reading the ENTIRE plaintext output before deciding you are done:
> - The newsletter name and author
> - Every prominently featured story (headline + summary)
> - Every item in abbreviated secondary sections — these often appear under headings like "More top news", "Also in the news", "In brief", "In related news", "Top stories", or similar. These are frequently bullet-point lists and are easy to miss. **Do NOT stop after the featured stories — explicitly scan for and include these secondary sections.**
> - The URL from the nearest `[LINK:...]` marker for each story — but only if that URL does **not** contain `outlook.office365.com`, `outlook.office.com`, or any other private-mailbox/webmail domain. If the only marker near a story is one of those, treat the story as having no link.
>
> Return everything as clean, readable text grouped by story, with each story's real article URL (or "no link available") noted. Do not truncate.

**Critical notes:**
- The bash sandbox CAN access `/var/folders/` paths via python3 — use python3 inside bash, not shell `cat`
- Do NOT use the `Read` file tool for these paths — it uses line-based pagination and fails on single-line files
- Do NOT defer oversized emails — read them with a subagent immediately when the error appears

Extract from each email:
- All article headlines and their summaries/blurbs
- Any hyperlinks to articles (look for anchor tags or URLs in the body) — excluding any link into the mailbox itself, per the rule above
- The newsletter name (from the sender)

### Step 4: Curate and write the digest

**Link rule (applies to every section below, no exceptions):** every link in the digest must be a public URL to the actual article or webpage — one a stranger with no access to Steve's mailbox could open and read. **Never** include a link containing `outlook.office365.com`, `outlook.office.com`, or any other webmail/OWA domain — these are private deep links into Steve's inbox, not public pages, and this digest is published on the public internet. If no public article URL is available for a story, write the story with no link rather than substituting any other URL (including the email's own `read_resource` URI). It is always better to omit a link than to include a private one.

Produce a well-formatted digest with the following sections:

---

**📰 EVENING NEWSLETTER DIGEST**
*[Today's date and time]*

**NEWSLETTERS REVIEWED THIS PERIOD:**
List each newsletter name/sender covered.

---

**🗞️ GENERAL SUMMARY & TOP HIGHLIGHTS**
A 2-3 paragraph narrative overview of the major themes and top stories across all newsletters this period. Write this as a proper summary a busy person could read in 60 seconds to get a clear sense of what's happening in the world today. Cover the biggest, most prominent stories — the things that are dominating the news cycle — even if they're well-known headlines. Include inline links where available (e.g. [story title](url)). The link should be to an article or page from the email, not to the email itself.

---

**⚡ UNUSUAL & OVERLOOKED STORIES**
Stories that would likely be missed by a casual headline skim — niche, surprising, counterintuitive, or underreported items. For each story:
- **Headline** — 1-2 sentence summary explaining why it's interesting or unusual
- 🔗 [Read more](link) — direct article links only, do not link to the email.

---

**🌲 NATURAL RESOURCE SECTOR & WEB DEV SPOTLIGHT**
Stories of particular relevance to a web developer serving clients in natural resources. This includes: geospatial/GIS technology, environmental data platforms, energy sector software, regulatory changes affecting resource extraction, digital transformation in mining/forestry/agriculture/oil & gas, APIs and data tooling for environmental monitoring, government policy affecting resource industries, etc. For each story:
- **Headline** — 1-2 sentence summary of the article.
- 🔗 [Read more](link)

---

**📋 FULL STORY INDEX**
A compact list of all headlines from this period with links, organized by newsletter, so Steve can quickly scan what else came in. **For each newsletter, include every story — both featured articles and any secondary/brief sections.** Do not omit the shorter bullet-point items at the bottom of newsletters.

---

### Step 5: Save the digest

Save the digest as a Markdown file at:
`/Users/steverichards/Code/DailyDigest/digests/newsletter-digest-evening-[YYYY-MM-DD-hh-mm-ss].md`

Replace [YYYY-MM-DD-hh-mm-ss] with today's date and time. Use `mcp__workspace__bash` to write the file (the bash mount path for this folder is `/sessions/[session-id]/mnt/Daily Digest/`). Update the skeleton file created in Step 2 with the fully curated content.

### Customization notes (for future edits)
- The folder being searched is: **Newsletters**
- The time window for evening is: **24 hours** (covers since the last digest was created)
- The user profile: web developer, clients in natural resource sector
- To add more spotlight topics, edit the "Natural Resource Sector & Web Dev Spotlight" section criteria above
- To change digest format, edit the section structure in Step 4

### If no newsletters are found
Write a brief note: "No newsletters received in the Newsletters folder in the past 24 hours." and save that to the output file.