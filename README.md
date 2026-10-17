This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Set these in `.env.local` (never committed) or in the Vercel project settings.

### "Verify you are human" at the start of an interview

The start form is protected without any third-party account, in this order, after the per-IP rate limits:

1. **Honeypot.** A text field named `website` that people never see (off-screen, hidden from screen readers, skipped by Tab). Anything in it, or a form submitted less than 3 seconds after its challenge was issued, answers `403 {"error":"human_check_failed"}`.
2. **Proof of work.** `GET /api/challenge` hands out a signed challenge (`{token, difficulty}`, 10-minute validity, 30 per IP per 10 minutes). The browser solves it in a Web Worker while the person reads (a muted "רגע, בודקים שזה לא רובוט" line shows meanwhile) and sends `pow: {token, counter}` with the session request. Missing: `403 pow_required`. Bad signature, expired, already used or wrong solution: `403 pow_failed`. Used nonces are kept in memory per instance; the 10-minute window and the per-IP limits bound a replay on another instance.
3. **Cloudflare Turnstile**, a second layer that is active only when its keys exist (below).

| Variable | Where | What it does |
|---|---|---|
| `MESSY_POW_BITS` | server only | Proof-of-work difficulty in leading zero bits. Default `16` (well under a second on a laptop, a second or two on an older phone). `0` turns the check off (the challenge is still issued, with difficulty 0, and a session starts without a solution). Values above 32 are clamped. |
| `TURNSTILE_SECRET_KEY` | server only | Cloudflare Turnstile secret. When set, `POST /api/session` also requires a `turnstile` token and verifies it with Cloudflare before an interview starts. Unset: that layer is skipped (local dev and previews work as before). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public (inlined in the browser bundle) | Cloudflare Turnstile site key. When set, the start form shows the "verify you are human" widget and the start button waits for it. Unset: no widget. |

Set both Turnstile variables together, or neither. Setting only the secret blocks every start (the browser never sends a token); setting only the site key shows a widget whose token is ignored. The signing key for challenges is the one the session tokens use (`SESSION_SECRET`, or one derived from `ANTHROPIC_API_KEY`).

### Storage, deletion and cleanup

| Variable | Where | What it does |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | server only | Read-write token of the **private** Vercel Blob store `messy-interviews` (set by the Blob integration together with `BLOB_STORE_ID`). When set, finished interviews are saved there (`BlobStore`, durable) and the delete link on the done screen is real. Unset: an in-memory store that is gone after a cold start, and the delete link is labelled as a demo. |
| `MESSY_PURGE_SECRET` | server only | Enables `POST /api/purge` for the pipeline or the operator: header `x-messy-purge-secret: <secret>`, body `{"id": "<24 hex>"}`. Deletes the record and writes a tombstone with reason `operator`. Unset: the route answers 404. Wrong secret: 403. Rate-limited per IP like `/api/delete`. |
| `CRON_SECRET` | server only | Protects `GET /api/cron/purge-expired` (Vercel's cron convention: `Authorization: Bearer <CRON_SECRET>`, anything else 401). `vercel.json` schedules it daily at 03:00 UTC; it removes expired records and answers `{"purged": n}`. Vercel sets this variable itself when a cron is configured. |

#### Object layout in the blob store (contract with the pipeline)

The pipeline (a separate Python system) reads the same store, so the pathnames below are a contract. All objects are written with exact pathnames (`addRandomSuffix: false`, `allowOverwrite: true`), `access: 'private'`, `contentType: application/json`, `cacheControlMaxAge: 0`. Private blobs are read through the SDK with the token, never through a URL.

| Pathname | Written by | Content |
|---|---|---|
| `interviews/<id>.json` | the bot, on finish | The `InterviewRecord`: `id` (24 hex), `sessionId`, `name`, `gender`, `email` (or `null`), `document`, `transcript`, `promptVersion` (the `PROMPT_VERSION` of the system prompt that ran the conversation; absent on records from before 2026-10-17), `createdAt`, `expiresAt` (createdAt + 90 days). |
| `stopped/<sessionId>.json` | the bot, on a distress stop | `{"at": "<ISO time>"}`. Nothing else is kept from a stopped conversation. |
| `tombstones/<id>.json` | the bot, on every deletion | `{"id", "deletedAt", "reason": "person" \| "expiry" \| "operator"}`. The pipeline reads these to take the person's site and its own state down, then deletes the tombstone. The tombstone is written before the record is deleted, so a failed delete can be retried. |
| `pipeline/<slug>/...` | the pipeline | Its own files. The bot never touches them. |

Deletion paths: the person (`/delete`, signed token in the URL hash, reason `person`); expiry (on read, or the daily cron, reason `expiry`); the operator or the pipeline (`/api/purge`, reason `operator`). Lionel's Google Sheet (fed by the Make webhook in production) and emails already sent are separate copies that none of these touch; the `/delete` page says so and gives the address to ask for their manual deletion.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
