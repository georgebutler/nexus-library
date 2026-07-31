# Nexus Library

Nexus Library is an XR-ready spatial game library built with Next.js, WebSpatial, Tailwind CSS, and the RAWG API. Named game collections stay local to the browser in `localStorage`; no database is required. Existing games stored under the original flat library format migrate into a permanent default collection on first load.

## Setup

1. Create a free RAWG API key at [rawg.io/apidocs](https://rawg.io/apidocs).
2. Copy `.env.example` to `.env.local`.
3. Set `RAWG_API_KEY` in `.env.local`.
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
2. Add `RAWG_API_KEY` under **Project Settings → Environment Variables**.
3. Deploy with the default Next.js settings.

The `/api/games` route keeps the key server-side and returns only the game fields used by the app. If the key is missing or invalid, the search and details interfaces show a user-readable error.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```
