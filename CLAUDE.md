# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kiezbox Emergency App: a SvelteKit PWA, statically built and deployed onto a BananaPi (the physical "Kiezbox" device). It provides offline-capable emergency info and SIP-based VoIP calling to emergency services when internet connectivity is limited or absent. The device itself runs a local API/network that the app talks to.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build (static output via `adapter-static`, to `build/`)
- `npm run preview` — preview the production build
- `npm run check` — sync SvelteKit types and type-check (`svelte-check`)
- `npm run check:watch` — same, in watch mode
- `npm run format` — write formatting with Prettier
- `npm run lint` — `prettier --check .` followed by `eslint .`
- `npm run deploy` / `CITY=<slug> npm run deploy:city` — build, then run `deploy.sh`, which `scp`s `build/` to the box. Target comes from `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_PATH`/`DEPLOY_PASSWORD` in `.env` or `.env.<slug>`. This is a real deploy to a live device — do not run without explicit user instruction.
- `CITY=<slug> npm run build:city` — build using `.env.<slug>`
- `dev`, `build` and `check` first run `scripts/prepare-city.js` (needs `PUBLIC_CITY`); `build` finishes with `scripts/check-size.js` (fails above 64 MB, the device limit).

There is no test suite configured (no vitest/playwright/jest) — don't assume one exists or invent test commands. CI (`.github/workflows/say.yml`) is currently a stub that just echoes a placeholder string on push/PR to `main`; it does not actually run lint/build, so don't treat "CI is green" as a real signal.

Package manager is npm (`package-lock.json`). Dependencies are kept current via Renovate (`renovate.json`).

## Architecture

**Single-page app, fully static.** `src/routes/+layout.ts` sets `prerender = true; ssr = false`, and `svelte.config.js` uses `@sveltejs/adapter-static`. There is exactly one route (`src/routes/+page.svelte`), which composes `Header`, `EmergencyCall`, `PrecautionGuide`, `Map`, and `Footer`. There are no server routes (`src/routes/api/**` does not exist) — anything that looks like an API call goes to the external Kiezbox device, not to SvelteKit server code.

**State: Svelte 5 runes, not props/context.** Feature state lives in `src/lib/state/*.svelte.ts` (re-exported from `src/lib/state/state.svelte.ts`) as module-level `$state` singletons. Components communicate by reading/writing these shared stores directly rather than via prop drilling or Svelte context:

- `mapState.svelte.ts` — the live MapLibre `Map` instance, active popup, layer list, popup DOM ref
- `poiState.svelte.ts` — the currently-selected POI feature (set on map marker click)
- `layerState.svelte.ts` — per-layer visibility, mutates the live map via `setLayoutProperty`
- `networkState.svelte.ts` (`NetworkStore`) — connectivity/captive-portal detection; polls the device's `/api/mode` every 15s for emergency-vs-normal mode and GPS coordinates
- `callState.svelte.ts` (`CallStore`) — SIP.js-based VoIP state machine for emergency calls; fetches SIP credentials from `/api/session` and connects over `wss://`

**Multi-city: one city per build.** City-specific data lives in `cities/<slug>/` (`city.config.json`, `tiles/` incl. `metadata.json`, `poi/`, optional `locales/` overrides); `cities/_template/` is the starting point. `scripts/prepare-city.js` copies the city selected by `PUBLIC_CITY` into `static/pbf-tiles/` and `src/lib/generated/` (both gitignored, never edit them). Code reads city values via `CITY` from `src/lib/config/city.ts` (bounds/center/zoom come from the tiles' `metadata.json`) — never hardcode city coordinates or names. City locale overrides are deep-merged onto the base locales in `src/lib/translations.js`; base locales must stay city-neutral.

**Two independent data sources, no app-side database:**

1. Static local data: POI GeoJSON in `cities/<slug>/poi/*.json` (imported from `$lib/generated/poi/`) (toilets, drinking water, water pumps, defibrillators), wired into the map via `src/lib/config/{layers.ts,sources.ts,layer-style-positron.ts}`. Map tiles are self-hosted Mapbox Vector Tiles (MVT, uncompressed), stored in `cities/<slug>/tiles/` and served from `/pbf-tiles/{z}/{x}/{y}.pbf` — no external tile provider. Tiles are generated outside this repo (vector-tiles-converter) and dropped in by hand.
2. The Kiezbox device's own local API: `src/lib/api.ts` (`apiFetch()`) hits `PUBLIC_API_URL` for `/api/mode`, `/api/admin/setMode`, `/api/session`, and captive-portal endpoints. This is the device's own REST API, not a project backend.

**Map component** (`src/components/Map/Map.svelte`): uses MapLibre GL JS (not Leaflet/Mapbox). Builds a style spec from the local pbf tiles plus the layer/source config above, adds Geolocate/Navigation/Fullscreen controls, and recenters on `NetworkStore.coordinates` reactively (`$effect`) once the device reports a location. Feature clicks write into `poiState` and open a MapLibre `Popup` whose content is the DOM node bound in `PopupCard.svelte` via `mapState.cardRef`. `Legend.svelte` reads `layerState`/layer config to drive visibility toggles.

**Device "mode" is a core domain concept.** `NetworkStore.mode.isEmergency` reflects the physical Kiezbox device's own state and changes app behavior (e.g. call button text/target differs between emergency and demo/normal mode). Don't treat this as ordinary connectivity state — it's reported by the device.

**PWA / offline:** `src/service-worker.ts` is a hand-written SvelteKit service worker (cache-first with network fallback, `SKIP_WAITING` messaging for updates); update-detection UI lives in `src/routes/+layout.svelte`. Manifest at `static/manifest.json`.

**i18n:** `sveltekit-i18n`, configured in `src/lib/translations.js`, fallback locale `de`. Locale dictionaries in `src/lib/assets/locales/{de,en,fr,it,es,tr}.json`.

**Shared types:** `src/lib/types.ts` and `src/lib/enums.ts` (e.g. `Mode`, `SIPUser`, `SessionResponse`, `CallState`, `DeviceType`) — reuse these rather than redefining shapes locally.

**Env config:** public env vars via `$env/static/public`: `PUBLIC_API_URL`, `PUBLIC_APP_HOSTNAME`, `PUBLIC_WSS_PATH`, `PUBLIC_USER_PREFIX`, `PUBLIC_LOG_LEVEL`, `PUBLIC_KB_TARGET_URI`, `PUBLIC_KB_DEMO_TARGET_URI`. `PUBLIC_CITY` selects the city at build time (only read by `scripts/prepare-city.js`).

**UI primitives:** `src/lib/components/ui/**` are generated shadcn-svelte-style primitives (bits-ui + tailwind-variants) — the eslint config deliberately ignores this directory; don't hand-edit generated primitive internals if a config/variant change would do.
