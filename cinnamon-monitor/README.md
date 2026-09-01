# Cinnamon Plantation Monitor — Lalan Rubbers Pvt Ltd

A mobile-first monitoring app for the cinnamon extent of the **Lalan Rubbers Agri Division**.
It gives Estate Managers, Division Managers/Field Officers and Top Management one shared view of
crop history, field maps, yield KPIs, formula-based yield predictions, management recommendations
and exportable reports.

The domain model follows Lalan's real structure — **Group → Estate → Division** — across the five
groups (Mahaoya, Sapumalkande, Udabage, Miyanawita, Pitiyakande) and their estates. The app is
cinnamon-first but every crop-specific field is parameterised so rubber, tea, coconut, oil palm and
forestry can be added without a schema rewrite.

---

## Quick start

The app uses PostgreSQL. Point it at a [Neon](https://neon.tech) branch or a local Postgres:

```bash
cd cinnamon-monitor
npm install
cp .env.example .env          # then set DATABASE_URL, DIRECT_URL and JWT_SECRET
npm run setup                 # prisma generate + migrate deploy + seed
npm run dev                   # http://localhost:3000
```

Need a database first? Either create a Neon branch (see [DEPLOYMENT.md](DEPLOYMENT.md)) or run one
locally:

```bash
docker run -d --name cinnamon-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cinnamon"
# DIRECT_URL="postgresql://postgres:postgres@localhost:5432/cinnamon"
```

`npm run setup` applies `prisma/migrations/0_init` and loads demo data. The seed **wipes every table
first**, so never run it against a database holding real records.

### Demo accounts

All seeded users share the password **`Cinnamon@123`**.

| Role | Email | Sees |
| --- | --- | --- |
| Top Management | `admin@lalanrubbers.lk` | Every group, estate and division |
| Group GM | `gm.mahaoya@lalanrubbers.lk` | Mahaoya group (Galagama Estate) |
| Group GM | `gm.sapumalkande@lalanrubbers.lk` | Sapumalkande + Udabage groups |
| Estate Manager | `em.galagama@lalanrubbers.lk` | Galagama Estate only |
| Division Manager | `dm.notinghill@lalanrubbers.lk` | Notinghill + Bayswater divisions |
| Field Officer | `fo.deaela@lalanrubbers.lk` | Deaela division only |

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection used by the app. On Neon this is the **pooled** URL (host contains `-pooler`) |
| `DIRECT_URL` | Yes | **Direct** (non-pooled) Postgres URL. Used only by `prisma migrate`, which cannot run through a pooler |
| `JWT_SECRET` | Yes | Signs the session cookie. Generate with `openssl rand -base64 32` |
| `SESSION_DAYS` | No | Session lifetime in days (default `7`) |

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run db:deploy` | Apply committed migrations (production and CI) |
| `npm run db:migrate` | Create a new migration during development |
| `npm run db:studio` | Browse and edit the database in a GUI |
| `npm run db:seed` | Re-seed demo data (wipes existing rows first) |
| `npm run db:reset` | Drop, re-migrate and re-seed |

### Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for a step-by-step Vercel + Neon Postgres deployment,
including every environment variable and the Root Directory setting that first deploys usually miss.

Enum-like fields are stored as `String` with the allowed values centralised in `src/lib/domain.ts`
rather than as native Postgres enums. That keeps the domain portable to Airtable/Glide single-selects
and lets new values ship without a migration; convert them to real enums if you would rather have
database-level checks.

---

## Folder structure

```
cinnamon-monitor/
├─ prisma/
│  ├─ schema.prisma           Group → Estate → Division data model (PostgreSQL)
│  ├─ migrations/             Committed SQL migrations (0_init)
│  └─ seed.ts                 Deterministic demo data (5 groups, 3 estates, 9 divisions)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx           Root layout + providers
│  │  ├─ providers.tsx        React Query client + auth context
│  │  ├─ login/               Sign-in screen
│  │  ├─ dashboard/           Role-aware landing page
│  │  ├─ estate/[estateId]/   Estate workspace (6 tabs)
│  │  ├─ division/[divisionId]/  Division detail + operations logging
│  │  ├─ admin/               Structure browser and user creation
│  │  └─ api/                 REST route handlers (see below)
│  ├─ components/
│  │  ├─ ui.tsx               KPI cards, badges, panels, tabs
│  │  ├─ AppShell.tsx         Header, account menu, navigation
│  │  ├─ charts.tsx           Recharts yield/rainfall charts
│  │  ├─ MapPanel.tsx         Lazy Leaflet wrapper + legend
│  │  ├─ DivisionMapView.tsx  GeoJSON boundaries, colour coding, popups
│  │  ├─ OperationForm.tsx    Field operation entry
│  │  └─ estate/              One component per estate tab
│  ├─ lib/
│  │  ├─ domain.ts            Roles, crops, statuses, agronomic baselines
│  │  ├─ kpi.ts               All KPI maths (framework independent)
│  │  ├─ prediction.ts        Cinnamon yield prediction formula
│  │  ├─ reports.ts           Report builders shared by JSON/CSV/PDF
│  │  ├─ pdf.ts               Server-side PDF (pdfkit)
│  │  ├─ csv.ts               CSV serialisation
│  │  ├─ auth.ts              Password hashing, JWT session cookie
│  │  ├─ rbac.ts              Role + scope access rules
│  │  ├─ queries.ts           Prisma loaders feeding the KPI engine
│  │  └─ http.ts / client.ts  Server and browser request helpers
│  └─ middleware.ts           Redirects anonymous visitors to /login
```

---

## Data model

| Model | Purpose |
| --- | --- |
| `Group` | One of the five groups; optional General Manager |
| `Estate` | Belongs to a group; manager, assistant manager, total area, main crops |
| `Division` | Belongs to an estate; area, crop, planting year, variety, soil, irrigation, GeoJSON boundary |
| `CinnamonBlock` | Optional sub-block of a division (block code, area, planting date, density) |
| `CropHistory` | One row per division per season: forecast vs actual yield, grade mix, harvest method |
| `OperationLog` | Field operations with input, rate, cost (LKR), labour hours, weather notes |
| `SoilWeatherSnapshot` | pH, N, P, K, organic matter, rainfall, temperature; `LAB`/`SENSOR`/`MANUAL` |
| `Prediction` | Stored model output per division and season with confidence and key drivers |
| `Recommendation` | Management action with priority, owner, due date and status |
| `User` | Role plus many-to-many access scopes to groups, estates and divisions |

Seasons are stored both as a label (`2024/25`) and as `seasonStart`/`seasonEnd` dates, so cost and
rainfall can be attributed to the right season window.

---

## KPI definitions

Implemented in `src/lib/kpi.ts`. Estate figures are **area-weighted** across cinnamon divisions.

| KPI | Definition |
| --- | --- |
| Cinnamon area (ha) | Sum of `areaHa` for divisions where `primaryCrop = CINNAMON` |
| Forecasted yield (kg/ha) | Area-weighted `expectedYieldKgHa` for the selected season |
| Actual yield (kg/ha) | Area-weighted `actualYieldKgHa` of the last **completed** season |
| Yield variance (%) | `(actual − forecast) / forecast × 100` for that same season |
| Forecast accuracy (%) | `(1 − mean(|actual − forecast| / forecast)) × 100` over all closed seasons, clamped to 0–100 |
| Cost per kg (LKR) | Total `OperationLog.costLkr` inside the season window ÷ total kg produced (`yield × area`) |
| Recommendation completion (%) | Completed recommendations ÷ all recommendations |
| Risk index (0–100) | `40 × K deficit + 35 × rainfall deficit + 25 × age stress` — see below |

**Risk index** — a composite of the three drivers management asked for. Each term is normalised to
0–1: potassium below the 150 ppm baseline, rainfall below the 1800 mm baseline, and stand age past
15 years (fully stressed at 30). A missing reading counts as 0.35 rather than 0, so gaps in data
raise attention instead of hiding it. Bands: `<25 LOW`, `<50 MEDIUM`, `≥50 HIGH`.

---

## Prediction logic

`src/lib/prediction.ts`:

```
base       = mean of the last 3 completed seasons (falls back to the planned target)
ageFactor  = standCurve(age) / standCurve(age during the base seasons)
rainFactor = 1 + 0.0005 × (avgSeasonRainfallMm − 1800)
kFactor    = 1 + 0.001  × (latestPotassiumPpm  − 150)

standCurve(age) = 1 + 0.05 × min(age, 10) − 0.02 × max(0, age − 12)
predictedYield  = clamp(base × ageFactor × rainFactor × kFactor, 80, 900)
```

**Why the age term is a ratio.** The raw stand curve reaches 1.5 for any mature stand. Applying it
directly to a base that is *already* the yield of that mature stand would inflate every prediction by
about 50%. Dividing by the curve value at the age the stand had during those base seasons isolates
the year-on-year change the coming season should bring: a 15-year stand gets ≈0.97 (gentle decline),
a 5-year stand ≈1.09 (still filling out). With no history the base is the planned target, which
already assumes a plateau stand, so the curve is normalised against the peak age instead.

`confidencePct` starts at 70 and moves with the evidence available: +8 for three seasons of history,
+4 for rainfall data, +3 for a soil potassium reading, −12 when there is no history at all, −5 for
stands over 20 years. It is clamped to 45–85.

All baselines live in `AGRONOMY_BASELINES` (`src/lib/domain.ts`) — tune them there, not in the formula.

---

## API

Every route is a Next.js Route Handler under `src/app/api`. Authentication is an HttpOnly JWT cookie;
each handler re-checks the caller's role and scope.

**Auth** — `POST /api/auth/register` (open only while the user table is empty, then Top Management
only) · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`

**Structure** — `GET /api/groups` · `GET /api/estates?groupId=` · `GET /api/estates/:id` ·
`GET /api/divisions?estateId=&crop=` · `GET /api/divisions/:id`

**Division records** — `GET /api/divisions/:id/crop-history` ·
`GET|POST /api/divisions/:id/operations` · `GET|POST /api/divisions/:id/soil-weather` ·
`GET|POST /api/divisions/:id/predictions` (POST recomputes and stores) ·
`GET|POST /api/divisions/:id/recommendations` · `GET /api/divisions/:id/metrics`

**KPIs** — `GET /api/estates/:id/kpis?season=` returns the scorecard, per-division metrics, the
forecast-vs-actual trend, the available seasons and the top five alerts.
`GET /api/dashboard` rolls the same maths up across everything the caller can reach.

**Recommendations** — `GET /api/recommendations?estateId=&divisionId=&status=&priority=` ·
`GET|PATCH /api/recommendations/:id`

**Reports** — each accepts `?estateId=` and `&format=json|csv` (the first also `pdf` and `&season=`):
`estate-season-performance`, `forecast-accuracy`, `soil-nutrition`, `management-actions`.

**Users** — `GET /api/users?estateId=` · `POST /api/users` (Top Management)

---

## Role-based access

Scope resolution lives in `src/lib/rbac.ts` and is enforced server-side on every read and write.

| Role | Read scope | Write |
| --- | --- | --- |
| `FIELD_OFFICER` | Only divisions assigned to them | Log operations and soil/weather on those divisions |
| `DIVISION_MANAGER` | Only divisions assigned to them | As above, plus update recommendation status |
| `ESTATE_MANAGER` | Every division in their estate(s) | Log operations, update recommendation status |
| `GROUP_GM` | Every estate in their group(s) | The above, plus create and edit recommendations |
| `TOP_MANAGEMENT` | Everything | Everything, plus user management |

A division assignment grants access to that division, **not** to the rest of its estate — so a Field
Officer on one division cannot browse their neighbours. Those roles get a division-centric dashboard
instead of estate roll-ups. Recommendation *content* can only be edited by the roles allowed to issue
them; everyone from Division Manager up can move the *status* forward.

---

## Reports

All four report builders return JSON and CSV. **Estate Season Performance** also renders a
server-side PDF (`pdfkit`, `src/lib/pdf.ts`) with the KPI grid, a per-division table and a risk
commentary section. Without an explicit `season` the performance report covers the last *closed*
season, so the actual and variance columns are populated rather than blank.

Download buttons for every format sit on the estate **Reports** tab.

---

## Extending to other crops

The model is already multi-crop: `Division.primaryCrop` and `CropHistory.crop` take any value from
`CROPS` in `src/lib/domain.ts`, and the seed includes a rubber division (Kirikanda) alongside the
cinnamon ones. To add rubber or tea properly:

1. Keep using `CROPS`; add the crop there if it is missing.
2. Add a baseline block beside `AGRONOMY_BASELINES` for that crop (target yield, rainfall and
   nutrient baselines, stand-age curve) and key it by crop.
3. Give `predictYield` the crop's baselines instead of the cinnamon constants — the formula shape
   (base × age × rain × nutrient) holds for perennials generally; only the coefficients change.
4. Drop the `crop: 'CINNAMON'` filter in `src/lib/queries.ts` / the KPI routes, or turn it into a
   request parameter so each dashboard can be scoped per crop.
5. Crop-specific columns (`gradeMix*` on `CropHistory`) are nullable, so a rubber season simply
   leaves them empty; add rubber's own quality fields as new nullable columns.

Nothing in the UI hard-codes cinnamon apart from labels.

---

## Porting to a no-code stack

The domain model and KPI definitions are kept explicit and framework-independent so this can be
rebuilt on a no-code platform without re-deriving the logic.

**Airtable + Softr** — one table per Prisma model; `Group → Estate → Division` become linked-record
fields. String enums become single-selects using the exact values in `domain.ts`. KPI columns become
rollups and formulas: cinnamon area is a `SUM` rollup of division area; yield variance is a formula
field; forecast accuracy is a rollup of per-season accuracy. Softr provides the role-gated pages;
map the five roles onto Softr user groups following the access table above.

**Glide** — Glide tables mirror the same models; computed columns replace `src/lib/kpi.ts`
(the prediction formula translates almost line for line into a maths column). Row Owners on the
Division table implement the division-level scoping; role columns on the user table drive tab
visibility. Glide's map component takes the same lat/long centroids used here.

**Bubble** — the Prisma models become Bubble data types with the same field names. Recreate the KPI
maths as backend workflows or reusable expressions; the report endpoints map onto API workflows that
return JSON, with a plugin for the PDF.

In every case the pieces worth copying verbatim are the **KPI definitions** and the **prediction
formula** above — they are the parts that are easy to get subtly wrong.

---

## Tech stack

Next.js 14 (App Router) · React 18 · Tailwind CSS · TanStack Query · Prisma · PostgreSQL (Neon) ·
Leaflet + react-leaflet · Recharts · pdfkit · bcryptjs + jsonwebtoken.

## Notes and limitations

- Division boundaries in the seed are generated rectangles around real estate centroids near
  Deraniyagala and Mawathagama. Replace `Division.geoJsonBoundary` with surveyed GeoJSON for
  production use.
- Yield, cost and soil figures in the seed are synthetic but agronomically plausible; they are
  generated from a fixed PRNG seed so every developer sees identical numbers.
- The map uses OpenStreetMap tiles and needs outbound network access to render its basemap;
  boundaries and colour coding still draw without it.
