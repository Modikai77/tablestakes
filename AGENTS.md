# Tablestakes Agent Notes

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Tests: `npm run test`
- Generate Prisma client: `npm run prisma:generate`
- Migrate database: `npm run prisma:migrate`
- Seed database: `npm run prisma:seed`

## Conventions

- Keep server-side service logic in `src/lib/store.ts`.
- Keep external clients lazy; builds should not require runtime env vars.
- Use Server Components by default and Server Actions for mutations.
- Keep user ownership checks in the server/data layer. Do not fetch restaurants, sources, lists or visits without scoping to the authenticated user.
- Preserve source evidence and keep AI extraction behind a review step.
- Avoid duplicate restaurants by matching normalized name and city before creating from candidates.
- Store image binaries in Vercel Blob when configured; keep URLs and metadata in Postgres.
- Keep UI mobile-first, compact and operational rather than marketing-led.
