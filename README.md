# Nexus Library

Nexus Library is an XR-ready spatial game library built with Next.js, WebSpatial, Tailwind CSS, and IGDB. Named game collections stay local to the browser in `localStorage`; no database is required.

## Setup

1. Register a Confidential Twitch application using the [IGDB setup guide](https://api-docs.igdb.com/#account-creation), then generate a Client Secret.
2. Copy `.env.example` to `.env.local`.
3. Set `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` in `.env.local`.
4. Install and run:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Install as an App

The production build includes a web app manifest, Nexus icons, Apple touch metadata, and a service worker. Deploy over HTTPS, then use the browser’s **Install app** or **Add to Home Screen** action before opening the installed app in WebSpatial.

## Spatial Preview

Start Next.js in one terminal:

```bash
pnpm dev
```

Then launch WebSpatial Builder in another terminal:

```bash
pnpm spatial
```

The same routes and components power the browser and spatial versions. Spatial mode enables transparent pass-through materials, independent spatialized panels, Z-axis elevation, and named game-detail scenes.

## Vercel

1. Import the repository into Vercel.
2. Add `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` under **Project Settings → Environment Variables**.
3. Deploy with the default Next.js settings.

The `/api/games` route keeps both credentials and the generated bearer token server-side. If the credentials are missing or invalid, the search and details interfaces show a user-readable error.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
