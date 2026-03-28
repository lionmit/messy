# Messy — Project Instructions

## What This Is
Messy is a conversational identity extraction tool that interviews professionals
and generates structured identity documents for website creation.
Product of Lionel Mitelpunkt's Creative GYM.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres + Storage)
- Claude API, Whisper API, Captions API
- Deployed on Vercel at messy.lionelmitelpunkt.com

## Project Rules
- This is a STANDALONE project — no dependencies on Lionel OS, Creative GYM, Youngivers, or Control Room
- No PII in git — all user data lives in Supabase only
- API keys in .env.local only — never committed
- All user-facing text must support Hebrew (RTL) and English
- The interview engine extracts identity, not collects info — it probes, challenges, and synthesizes
