# Deploying to Vercel with Neon Postgres

The app lives in the **`cinnamon-monitor/` subdirectory** of this repository. That single fact
causes most failed first deploys — see step 3.

> UI labels in the Neon and Vercel dashboards shift over time. The names below were accurate when
> this guide was written; if a label has moved, the surrounding step still describes what you are
> looking for.

---

## Step 1 — Create the Neon database (browser)

1. Go to **https://console.neon.tech** and sign in.
2. **New Project**. Give it a name (e.g. `cinnamon-monitor`) and pick the region closest to your
   Vercel region — cross-region round trips are the single biggest latency cost here. For Sri Lanka
   the usual choice is Singapore (`ap-southeast-1`).
3. Once created you land on the project dashboard with a **Connection string** panel.
4. You need **two** different strings from this panel:
   - **Pooled** — the default. Its host contains **`-pooler`**. This is `DATABASE_URL`.
   - **Direct** — toggle off *Connection pooling* (or pick "Direct connection"). Same host
     **without** `-pooler`. This is `DIRECT_URL`.
5. Copy both somewhere temporary. The password is only shown in full here; if you lose it, use
   **Reset password** on the role rather than guessing.

**Why two URLs.** The app runs on serverless functions that open many short-lived connections, so it
must go through Neon's pooler. But Prisma migrations use session-level statements a pooler cannot
carry, so `prisma migrate` needs the direct connection. The schema declares both:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled  — used by the app
  directUrl = env("DIRECT_URL")     // direct  — used by migrations
}
```

Append these query parameters if Neon's copy button did not already include them:

| URL | Required parameters |
| --- | --- |
| `DATABASE_URL` (pooled) | `?sslmode=require&pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` (direct) | `?sslmode=require` |

`pgbouncer=true` stops Prisma using prepared statements the pooler cannot handle;
`connection_limit=1` keeps each serverless invocation from opening a pool of its own.

---

## Step 2 — Apply the schema to Neon (terminal, once)

Run this from your machine, not from Vercel. It creates the 13 tables and 21 indexes.

```bash
cd cinnamon-monitor
cp .env.example .env          # .env is gitignored — never commit it
# edit .env: paste your two Neon URLs and a real JWT_SECRET

npm install
npx prisma migrate deploy     # applies prisma/migrations/0_init
```

Expected output ends with `All migrations have been successfully applied.`

### Seeding — read before you run it

`npm run db:seed` **deletes every row in every table first**, and it creates nine demo users whose
password (`Cinnamon@123`) is published in this repository's README.

- **Pilot / demo deployment** — seed it, then immediately change or delete those accounts:
  ```bash
  npm run db:seed
  ```
- **Real deployment** — do *not* seed. Leave the tables empty and create your first real
  administrator through the bootstrap endpoint, which is open only while the user table is empty:
  ```bash
  curl -X POST https://YOUR-APP.vercel.app/api/auth/register \
    -H 'Content-Type: application/json' \
    -d '{"name":"Your Name","email":"you@lalanrubbers.lk","password":"a-strong-password"}'
  ```
  It creates a `TOP_MANAGEMENT` user and then locks itself: every later call requires an
  authenticated Top Management session.

  **Known gap:** the `/admin` screen creates *users* but not groups, estates or divisions. With an
  unseeded database you will have no estate structure to look at. Until an admin CRUD screen exists,
  create that structure either by adapting `prisma/seed.ts` to your real estate list (removing the
  `deleteMany` calls at the top) or through `npx prisma studio`.

---

## Step 3 — Import the project into Vercel (browser)

1. Go to **https://vercel.com/new**.
2. Pick the Git provider, find **`Neja-Publication-`**, click **Import**.
3. **Set Root Directory to `cinnamon-monitor`.** Click **Edit** next to Root Directory and select the
   folder. This is the step that breaks deploys: the repository root holds an unrelated Vite
   bookstore, so if you leave Root Directory at `./` Vercel builds that instead and you get either a
   build error or the wrong site.
4. Framework Preset should switch to **Next.js** on its own once the root directory is right. Leave
   Build Command, Output Directory and Install Command on their defaults — `package.json` already
   runs `prisma generate` in both `postinstall` and `build`.
5. Expand **Environment Variables** and add the four in the table below *before* the first deploy.
6. Click **Deploy**.

---

## Environment variables to set in the Vercel dashboard

Settings → Environment Variables. Tick **Production**, **Preview** and **Development** for each
unless noted.

| Name | Value | Required | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** string (host contains `-pooler`) | Yes | Add `?sslmode=require&pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Neon **direct** string (no `-pooler`) | Yes | Prisma reads it for migrations; the schema will not load if it is absent |
| `JWT_SECRET` | Long random string — `openssl rand -base64 32` | Yes | Signs session cookies. **Do not reuse the value from `.env.example`.** Changing it signs everyone out |
| `SESSION_DAYS` | e.g. `7` | No | Session lifetime in days; defaults to `7` if unset |

That is the complete list — the app reads no other environment variables.

Two things worth knowing:

- **Use a different `JWT_SECRET` for Preview than for Production** if preview deployments will hold
  real data; a shared secret means a session minted on a preview URL is valid against production.
- **Environment variable changes do not apply to existing deployments.** After editing any of these,
  go to **Deployments → ⋯ → Redeploy** or push a commit. A common symptom of skipping this is the app
  building fine but every request returning a 500 about a missing `JWT_SECRET`.

---

## Step 4 — Verify the deployment (browser)

1. Open your `https://YOUR-APP.vercel.app` URL. You should be redirected to `/login`.
2. Sign in (seeded demo account, or the admin you registered in step 2).
3. Check each of these, because they exercise a different part of the stack:
   - **Dashboard loads with numbers** → Prisma is reaching Neon through the pooled URL.
   - **Estate → Reports → Download PDF** → `pdfkit` found its font files inside the serverless
     bundle. If this 500s with `ENOENT ... Helvetica.afm`, see troubleshooting below.
   - **Estate → Map** → Leaflet loads OpenStreetMap tiles over the public internet.
   - **Sign out and back in** → the session cookie is being signed and read correctly.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build succeeds but deploys the bookstore site | Root Directory not set | Settings → General → Root Directory → `cinnamon-monitor`, redeploy |
| `Environment variable not found: DIRECT_URL` | Only `DATABASE_URL` was set | Add `DIRECT_URL`; the datasource block requires both |
| 500s mentioning `JWT_SECRET is not set` | Variable missing, or set after the last deploy | Add it, then **redeploy** — env changes are not retroactive |
| `prepared statement "s0" already exists` | Pooled URL missing the pgbouncer flag | Add `&pgbouncer=true&connection_limit=1` to `DATABASE_URL` |
| `Can't reach database server` at runtime, build fine | Expected — nothing touches the DB at build time; this is a runtime URL or region problem | Check `DATABASE_URL`, and that the Neon project is not suspended |
| PDF route 500s with `ENOENT … Helvetica.afm` | pdfkit's fonts were not traced into the function | `next.config.mjs` already pins them via `outputFileTracingIncludes`; confirm that block survived any config edit |
| Slow first request after idle | Neon scale-to-zero cold start | Expected on the free tier; disable scale-to-zero on a paid plan |

---

## Local development after this change

The project no longer uses SQLite. For local work, either point `.env` at a **Neon development
branch** (Neon → Branches → New Branch, then use that branch's two URLs) or run Postgres locally:

```bash
docker run -d --name cinnamon-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# .env:
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cinnamon"
#   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/cinnamon"

npm run setup    # prisma generate + migrate deploy + seed
npm run dev
```

A Neon branch is usually the better choice: it is a copy-on-write clone of production data, so local
behaviour matches deployed behaviour exactly.

## Changing the schema later

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name describe_your_change   # creates the migration locally
git add prisma/migrations && git commit && git push  # commit it
npx prisma migrate deploy                            # apply to Neon
```

Commit migrations. Never use `prisma db push` against a database that holds real data — it
reconciles the schema without a migration history and can drop columns silently.
