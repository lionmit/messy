# The admin dashboard (/admin)

One protected page for Lionel: every person in the store and where they stand, with two actions
(release a held site, purge a person). It needs no GitHub token: actions are files the pipeline
runner picks up on its next 10-minute cycle.

## Environment

| Variable | Where | What |
|---|---|---|
| `ADMIN_USER` | Vercel project env (all environments you want the page in) | Basic auth user name |
| `ADMIN_PASSWORD` | same | Basic auth password; long and random |
| `BLOB_READ_WRITE_TOKEN` | already set (the interview store) | the dashboard reads and writes the same private store |

Both `ADMIN_USER` and `ADMIN_PASSWORD` must be set. While either is missing, `/admin` and every
`/api/admin/*` route answer **404**, so a deployment without them exposes nothing. With them set,
the middleware (`src/middleware.ts`) answers 401 with `WWW-Authenticate: Basic realm="MESSY admin"`
until the browser sends the right header. No cookies, no session: the browser resends the header on
each request. The compare is constant time. The route handlers repeat the check (`src/lib/admin/guard.ts`).

## Routes

- `GET /api/admin/overview`: one read of the store, one JSON (`src/lib/admin/overview.ts`). Lists
  `interviews/`, `tombstones/` and `pipeline/`; reads each record (name, createdAt, expiresAt and
  whether an email was left are projected; document and transcript never are), each
  `pipeline/<slug>/state.json`, `pipeline/_slugs.json`, `pipeline/_count.json` and
  `pipeline/_digest.md` when present. `stage` is the furthest step whose status is `done`
  (intake, content, illustrate, build, deploy_preview, email_preview, comments, fix, go_live);
  `held` is true when any step is `held`, `failed` or `blocked`, with the note code in `heldNote`.
  `mail.end` is the state's `golive` entry. Never cached.
- `POST /api/admin/command` `{action: "release" | "purge", slug}`: validates (slug matches
  `^[a-z0-9][a-z0-9-]{0,60}$`), writes the command file below, returns `{ok: true, file}`.
  20 requests per IP per 10 minutes. The slug is never logged.

## The `_commands` contract (dashboard -> runner)

Path: `pipeline/_commands/<requestedAt with ':' replaced by '-'>-<action>-<slug>.json`

Example: `pipeline/_commands/2026-10-17T09-30-00.000Z-release-i-aaaaaaaaaaaa.json`

```json
{
  "action": "release",
  "slug": "i-aaaaaaaaaaaa",
  "id": "aaaaaaaaaaaa000000000001",
  "requestedAt": "2026-10-17T09:30:00.000Z",
  "by": "admin"
}
```

- `action`: `release` (send the held preview on: the same as `run.py <slug>`) or `purge` (the same
  as `run.py --purge <slug> --reason operator`).
- `id`: the record id from `pipeline/_slugs.json`, or `null` when the slug is not mapped yet.
- The runner is expected to process the files in name order (oldest first), then delete each one it
  handled. A file that is still there shows on the dashboard as a pending command on that person's
  row; the dashboard never deletes command files.
- The file name alone carries action, slug and time, so the runner can decide without opening it.

## The page

`/admin` (`src/app/admin/page.tsx` + `src/components/admin/AdminDashboard.tsx`, strings in
`src/content/admin.ts`): counters, one card per person (newest first) with stage, hold tag, links,
mail status and the two buttons, the digest tail, and a footer with the generation time and a
refresh button. "לשחרר" is enabled only when the stage is `deploy_preview`, the preview mail has not
been sent and no release is already pending. "למחוק" always asks for a second click.
