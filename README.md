# ArcLibrary

> **A self-hostable, AI-augmented personal knowledge wiki.**
> Next.js + MDX. Three-tier taxonomy: **Domain → Level → Topic**, fully
> defined by *your* `content/` folder.

ArcLibrary is the chassis: clone it, drop your own MDX into `content/`,
deploy. The repo ships with no opinions about *what* you should write —
the categories, levels, and chapters are entirely driven by data, so the
same codebase works equally well for engineering notes, course material,
a research journal, or a public field guide.

- 📚 **Editorial-first reading experience.** Calm typography, hairline geometry, no decorative noise.
- 🔎 **Instant ⌘K search** powered by Fuse.js over a build-time index.
- ✨ **AI assistant** that reads *your* MDX, navigates the user to the right page, and highlights the matching paragraph automatically.
- 🧱 **MDX components** — callouts, key-value tables, side-by-side compare, numbered steps, mermaid diagrams, KaTeX math.
- 🌗 **Dark-first** theme with light-mode parity.
- 🌐 **Built-in i18n** (`zh` default, `en` available).
- 🛡️ `/api/chat` is **rate-limited**, **origin-checked**, and writes a structured **audit log** for every request.
- 📈 **First-class SEO** — per-topic OG / Twitter Card metadata, auto-generated `sitemap.xml` / `robots.txt`, dynamic OG cover image.

> 中文文档 → [`README_ZH.md`](./README_ZH.md)

---

## Quick start

```bash
git clone https://github.com/<your-org>/ArcLibrary.git
cd ArcLibrary
pnpm install
cp .env.example .env.local        # optional — fill in OPENAI_API_KEY etc.
pnpm dev                          # → http://localhost:3000
```

Useful scripts:

| Command           | What it does                                             |
| ----------------- | -------------------------------------------------------- |
| `pnpm dev`        | Dev server with hot reload                               |
| `pnpm build`      | Production build (also rebuilds the search index)        |
| `pnpm start`      | Serve the production build                               |
| `pnpm lint`       | `eslint .`                                               |
| `pnpm typecheck`  | `tsc --noEmit`                                           |

Authoring rules, frontmatter spec, and the full MDX component catalogue
live in **[`AUTHORING.md`](./AUTHORING.md)**.

---

## Project structure

```text
content/                 # 100% yours: <domain>/<level>/<slug>.md(x)
src/
  app/                   # Next.js App Router
    api/chat/route.ts    # AI endpoint (rate-limited + audit-logged)
  components/            # UI building blocks
  ai/                    # AI panel, server, tool definitions
  lib/                   # content loader, rate-limit, audit, site config
  i18n/                  # locale dict + provider
scripts/build-search-index.mjs
public/search-index/zh.json # one shard per locale, generated at build time
public/search-index/en.json # client lazy-fetches the active locale only
```

Routes follow the file structure:
`/<domain>/<level>/<slug>` ↔ `content/<domain>/<level>/<slug>.md`.

The taxonomy is data-driven: edit `CATEGORIES` / `LEVELS` in
`src/lib/config.ts` and create the matching `content/<slug>/<level>/`
folders. Sidebar, breadcrumbs, search index and AI tools all pick it up.

---

## AI assistant

The right-side panel is opened via the floating "Ask AI" button. It is
grounded in your wiki via a small set of tool calls and is allowed to
**automatically navigate and highlight** content on behalf of the user.

### Configuration

```env
# Required to enable the assistant.
OPENAI_API_KEY=sk-...

# Optional — defaults shown.
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Rate-limit tuning.
ARC_AI_RATE_CAPACITY=20
ARC_AI_RATE_WINDOW_MS=60000
ARC_AI_ALLOWED_ORIGINS=https://wiki.example.com
```

Any **OpenAI-compatible** endpoint works (Azure, vLLM, Ollama, DeepSeek,
Qwen, OpenRouter, Together, Groq, …). If `OPENAI_API_KEY` is unset the
panel still mounts but shows a "not configured" notice.

### Abuse protection & audit

- **Same-origin check.** Cross-site POSTs get `403 forbidden` unless the
  Origin / Referer host is in `ARC_AI_ALLOWED_ORIGINS`.
- **In-memory token bucket per IP.** 20 req / 60 s by default; tunable.
- **Body size caps.** Max 24 messages, 4 000 chars per message,
  16 000 chars total.
- **Audit log.** Every `/api/chat` hit emits one structured JSON line on
  stdout, prefixed with `[arc-ai-audit]`, containing the client IP,
  truncated User-Agent, host / origin, locale, model, message + char
  counts, tool-call count, **token usage** reported by the upstream, and
  request latency. Tail it with `vercel logs`, `docker logs`,
  `journalctl`, or any log shipper. **No prompt content is ever logged.**

The token bucket lives in process memory. For multi-region deploys swap
`src/lib/rate-limit.ts` for a Redis/Upstash-backed implementation — the
public `consume(key, cost?)` API is stable.

---

## Analytics

Optional [Rybbit](https://rybbit.io) integration. Both the script URL and
site ID are read from environment variables:

```env
NEXT_PUBLIC_RYBBIT_SITE_ID=<your-site-id>
NEXT_PUBLIC_RYBBIT_SCRIPT_URL=https://app.rybbit.io/api/script.js  # optional
```

Leave both **blank** when forking — that way you won't accidentally pipe
traffic into the upstream maintainer's analytics account just by
deploying. Set them only in the canonical deployment's environment.

---

## Deployment

### Vercel

1. Push your fork to GitHub.
2. "Import Project" on [Vercel](https://vercel.com).
3. Set the env vars from `.env.example` (don't forget
   `NEXT_PUBLIC_SITE_URL`).
4. Deploy. The build runs `pnpm build`, which regenerates the search
   index automatically.

### Docker

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are
included. Quick start:

```bash
cp .env.example .env             # fill in values
docker compose up -d --build     # → http://localhost:3000
```

The image uses Next.js [`output: "standalone"`][standalone] for a slim
runtime layer (~150 MB). For multi-host deploys, put it behind a reverse
proxy (Caddy / Nginx / Traefik) that terminates TLS and forwards
`X-Forwarded-For` so the rate limiter sees real client IPs.

[standalone]: https://nextjs.org/docs/pages/api-reference/next-config-js/output

### Self-host with Node

```bash
pnpm install
pnpm build
PORT=3000 pnpm start
```

---

## Contributing

1. **Content** — drop your `.md` under `content/<domain>/<level>/`,
   fill the [frontmatter](./docs/AUTHORING.md), open a PR.
2. **Code** — read [`DESIGN.md`](./docs/DESIGN.md), keep changes scoped,
   run `pnpm lint && pnpm typecheck` before pushing.

---

## License

MIT. See [`LICENSE`](./LICENSE).
