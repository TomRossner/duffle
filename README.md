<p align="center">
  <img src="public/duffle%20logo.webp" alt="Duffle" width="220">
</p>

<p align="center"><strong>One place for the whole trip.</strong></p>

<p align="center"><a href="https://duffle.tomrossner.dev">duffle.tomrossner.dev</a></p>

Duffle is a shared trip planner. Create a trip, invite the people who are going, and keep the plan, the weather, the documents, the packing list, and who owes what in one account.

## What you can do

**Trips and people.** Create a trip with dates and a home currency. Admins invite travelers by email or share a join link. Anyone with a Duffle account can join from that link. Travelers see pending invites in the app and get notified when a trip changes.

**Places.** Add destinations with dates and notes. Search places with Google Maps, then see them on the trip map. Flights and stays sit alongside those destinations, with confirmation numbers and the travelers on each flight. The flight form suggests airports and airlines as you type, from bundled OurAirports and OpenFlights data.

**Weather.** Each destination loads a daily forecast from [Open-Meteo](https://open-meteo.com/): temperature, rain, wind, and conditions. Past dates use the archive; upcoming dates use the forecast.

**Schedule.** Lay the days out as a timeline or a board and add activities with times, places, notes, and tags. A plan or activity can run all day or repeat on chosen days of the week.

**Money.** Track planned and actual expenses in the trip currency, with exchange rates when someone pays in another currency. Split a cost equally, by exact amounts, or by percent, then record settlements so balances stay current. Budget sheets cover flights, lodging, cars, and custom tables, and a row can become a real expense when it is paid.

**Documents and insurance.** Keep passports and other personal documents on your account, then attach the ones a trip needs. Trip files and insurance policies (provider, dates, policy number, and an optional receipt) stay with the group. Images and PDFs are both accepted, and PDFs open in the browser's viewer to read or print. With the AI gateway configured, Duffle reads the document number and dates from an upload, and fills in an insurance policy's provider, type, number, dates, insured travelers, and premium from the policy file.

**Closet and packing.** Build a closet of clothes with temperature ranges, weather, and activities, or upload a photo and let Duffle fill in the item. Duffle suggests what to pack from the forecast and the day’s plans. With the Neon AI Gateway configured, a packing agent chooses from the closet and explains each piece; otherwise a weather-and-activity score does the same job. Check items into luggage, and keep a shared list for things the group is bringing together.

**Account.** Sign in with Google or with email and password. Your profile holds a photo, contact details, and home country, which is used for destination flags. Confirmation and password-reset emails use a branded HTML template with a plain-text fallback.

## Stack

- [Next.js](https://nextjs.org) 16 and React 19
- PostgreSQL with [Prisma](https://www.prisma.io)
- [Auth.js](https://authjs.dev) (email and password, plus Google)
- Tailwind CSS and Base UI
- Optional AI features through the [Neon AI Gateway](https://neon.com) and the AI SDK
- Uploads in `./uploads` locally, or any S3-compatible store such as Cloudflare R2
- Optional browser push notifications

## Run it locally

You need Node.js and either Docker or a local PostgreSQL you start with `npm run db:local`.

```bash
npm install
cp .env.example .env
```

Set `AUTH_SECRET` in `.env` to a long random string. The database URL in `.env.example` matches the Docker Compose file:

```bash
npm run db
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET`, `AUTH_URL` | Session signing and the public app URL |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google sign-in. Redirect URI: `http://localhost:3000/api/auth/callback/google` |
| `GOOGLE_MAPS_API_KEY` | The trip map in the browser (Maps JavaScript API). Also used for place search when no server key is set |
| `GOOGLE_MAPS_MAP_ID` | Optional. Map ID for the trip map, which Google's advanced markers require. Create one under Map Management in Google Cloud. Unset, the map uses Google's `DEMO_MAP_ID` |
| `GOOGLE_MAPS_SERVER_KEY` | Optional. Place search and address lookup from the server (Places API (New), Geocoding API). In production, restrict it by server IP, since a key restricted to websites is rejected on the server |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Confirmation and password-reset email. Unset locally, the link is printed in the server log |
| `UPLOADS_DIR` | Upload directory when `S3_*` is unset. On a server, put this outside the app directory |
| `S3_*` | Optional object storage. Unset values keep files in `UPLOADS_DIR` or `./uploads` |
| `VAPID_*` | Optional web push. Generate keys with `npx web-push generate-vapid-keys`. The in-app bell works without them |
| `NEON_AI_GATEWAY_BASE_URL`, `NEON_AI_GATEWAY_TOKEN` | Optional AI features: the packing agent, the Excel import agent, and the document, insurance, and closet photo readers. `neon deploy` writes these after `aiGateway` is enabled in `neon.ts`. When they are unset, suggestions use the scored list, Excel imports use the built-in table detector, and forms are filled in by hand |
| `PACKING_AGENT_MODEL` | Optional gateway model id for clothing suggestions. Defaults to `gemini-3-flash` |
| `DOCUMENT_AGENT_MODEL` | Optional model for reading documents and insurance policies. Must accept images and PDFs. Defaults to `gemini-3-flash` |
| `CLOSET_AGENT_MODEL` | Optional model for reading closet photos. Must accept images. Defaults to `gemini-3-flash` |
| `BUDGET_IMPORT_AGENT_MODEL` | Optional model for turning an uploaded Excel workbook into budget tables. Defaults to `gemini-3-flash` |

`npm run build` applies pending migrations and then builds the app. `npm run start` serves that build.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check without emitting |
| `npm test` | Unit tests in `src/lib/*.test.ts` |
| `node --env-file=.env.local scripts/seed-demo.mjs` | Demo users (`alex@example.com`, `sam@example.com`, `jordan@example.com`, password `password123`), a past trip, and an upcoming trip with a pending invite |
| `node scripts/build-flight-data.mjs` | Regenerates the airport and airline data behind flight autocomplete |

## Production

A single VPS can run `npm run build` and `npm run start` behind HTTPS. Set `AUTH_URL` to that public `https` origin and `AUTH_SECRET` to a long random string.

Password sign-up and password reset send email, so set the `SMTP_*` variables before opening registration. Google sign-in does not need SMTP.

Leave `S3_*` unset to store files on disk. Set `UPLOADS_DIR` to a folder outside the release directory, and back it up with the database. Bind Postgres to localhost and use a password other than the local Compose default. The Compose file publishes `5432` on `127.0.0.1` only. Point the reverse proxy at the app and send `X-Real-IP` so sign-in rate limits see the visitor address. `GET /api/health` checks the database.

[`deploy/README.md`](deploy/README.md) walks through the setup behind [duffle.tomrossner.dev](https://duffle.tomrossner.dev): nginx in front, the app under systemd, release-by-release deploys with `deploy/deploy.sh`, and nightly backups with `deploy/backup.sh`.
