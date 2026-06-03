# Tablestakes

A private restaurant memory app for capturing messy recommendations, reviewing AI-extracted candidates, enriching approved restaurants, searching the library, and logging visits with photos.

## Stack

- Next.js App Router, TypeScript, Tailwind
- Prisma + Postgres
- Optional pgvector for embeddings
- OpenAI API for extraction and image understanding
- Google Places API for enrichment
- Vercel Blob for visit/source image storage
- Google OAuth login via NextAuth/Auth.js

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The app requires Google login for private library access. Without Google OAuth variables, `/sign-in` explains what is missing. With no `DATABASE_URL`, authenticated sessions use in-memory demo data scoped to the signed-in email.

## Environment Variables

```bash
DATABASE_URL="postgresql://user:password@host:5432/tablestakes"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
OPENAI_API_KEY="sk-..."
GOOGLE_PLACES_API_KEY="..."
BLOB_STORE_ID="store_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..." # legacy token auth; optional when Vercel Blob OIDC is connected
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-random-secret"
```

For Vercel Blob, new Vercel project connections may use OIDC and add `BLOB_STORE_ID` plus `BLOB_WEBHOOK_PUBLIC_KEY` instead of `BLOB_READ_WRITE_TOKEN`. The app supports either `BLOB_STORE_ID` for Vercel OIDC uploads or the legacy `BLOB_READ_WRITE_TOKEN`. If neither is present, local uploads use demo placeholder URLs.

In Google Cloud Console, create an OAuth client and add this authorized redirect URI:

```txt
http://localhost:3000/api/auth/callback/google
```

For production, also add:

```txt
https://your-domain.com/api/auth/callback/google
```

For pgvector-backed semantic search, enable the extension in Postgres:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The Prisma schema includes an `Embedding` model with a `vector` column placeholder. The current v1 uses keyword/semantic fallback scoring in the app and is ready for a follow-up pgvector query layer.

## Core Flows

- Library: `/` has keyword and natural-language-ish search plus city, neighbourhood and status filters.
- Manual add/edit: `/restaurants/new` and `/restaurants/[id]/edit`.
- Source inbox: `/sources` accepts pasted text, URLs, notes and image uploads.
- Extraction review: `/sources/[id]` runs AI extraction when `OPENAI_API_KEY` is present, otherwise a local heuristic fallback.
- Approval: extracted candidates can be approved, rejected, or merged with an existing restaurant.
- Enrichment: restaurant detail pages include Google Places enrichment. Without a key, a low-confidence demo match is returned.
- Visits: restaurant detail pages include visit logging, notes, dishes, wine notes, multiple photo uploads and a lightbox gallery.
- Lists: `/lists` lets each signed-in user create personal restaurant lists.
- Profile: `/profile` shows the signed-in Google profile and account-scoped counts.
- Privacy: restaurants, sources, candidates, lists and visit logs are filtered by the current authenticated user.

## Manual Test Steps

1. Configure Google OAuth env vars, visit `/sign-in`, and sign in with Google.
2. Add a restaurant manually from `/restaurants/new`, save, then edit it.
3. Paste messy recommendation text in `/sources`, open the source, and run extraction.
4. Upload a screenshot/image source and run extraction. With `OPENAI_API_KEY`, image URLs are passed to OpenAI; without it, fallback extraction uses available text and labels.
5. Approve one candidate and reject another.
6. Approve a candidate while selecting an existing restaurant in the merge dropdown.
7. Create a personal list in `/lists`, then add a restaurant to it from the restaurant detail page.
8. Click `Enrich` on a restaurant detail page with `GOOGLE_PLACES_API_KEY` configured.
9. Search the library with filters and natural phrases such as `fancy wine lunch` or `child-friendly Broadstairs`.
10. Add a visit with dishes, wine notes and a rating.
11. Upload visit photos and open them in the gallery lightbox.
12. Sign in with a second Google account and confirm the first account's restaurants, lists, sources and visits are not visible.
13. Run `npm run test`, `npm run typecheck`, and `npm run build`.

## Vercel Deployment

1. Create a Vercel project connected to this repo.
2. Add the environment variables above in Vercel.
3. Provision Postgres and Vercel Blob.
4. Run the Prisma migration against the production database.
5. Deploy.

## Notes

This is intentionally a v1: human review is required before AI candidates become restaurant records, original evidence is preserved in `Source`, and integrations fail softly when keys are missing.
