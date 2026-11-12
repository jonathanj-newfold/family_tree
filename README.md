# Family Archive

Private family tree. Next.js 15 + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage).
Security is enforced by Row Level Security in the database; the UI only mirrors it.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and set the publishable key (Supabase > Project Settings > API Keys).
   Never use the service-role key in this app.
3. `npm run dev`, `npm test`, `npm run typecheck`, `npm run build`

## Granting access
Sign-ups get no access by default. The first account ever created became `owner`.
To grant access, owner runs in the Supabase SQL editor:
`insert into public.family_users (user_id, role) select id, 'contributor' from auth.users where email = 'x@y.com';`
Roles: owner, admin, contributor (add/edit), viewer (deceased people only).

## Deploy (Vercel)
Set the two `NEXT_PUBLIC_SUPABASE_*` env vars. In Supabase > Auth > URL Configuration add the Vercel URL as Site URL.
Enable leaked-password protection under Auth > Providers > Email.
