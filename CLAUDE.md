# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kiezbox Emergency App: a SvelteKit PWA, statically built and deployed onto a BananaPi (the physical "Kiezbox" device). It provides offline-capable emergency info and SIP-based VoIP calling to emergency services when internet connectivity is limited or absent. The device itself runs a local API/network that the app talks to.

## Commands

- `npm run dev` — start the Vite dev server (serves `/city/` from `cities/<PUBLIC_CITY>/`, or from `CITY_DIR`)
- `npm run build` — production build (static output via `adapter-static`, to `build/`); city-neutral, contains no city data
- `npm run preview` — preview the production build (serves `/city/` like `dev`, e.g. `CITY_DIR=dist/cities/berlin npm run preview`)
- `npm run package:city -- <slug>` — validate `cities/<slug>/` and package it into `dist/cities/<slug>/` incl. the generated `city.json` manifest; fails if `build/` + city data exceed 64 MB (the device limit)
- `npm run check` — sync SvelteKit types and type-check (`svelte-check`)
- `npm run check:watch` — same, in watch mode
- `npm run format` — write formatting with Prettier
- `npm run lint` — `prettier --check .` followed by `eslint .`
- `npm run deploy` / `CITY=<slug> npm run deploy:city` — build, then run `deploy.sh`, which `scp`s `build/` into `DEPLOY_PATH` on the box, keeping `DEPLOY_PATH/city/`. Target comes from `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_PATH`/`DEPLOY_PASSWORD` in `.env` or `.env.<slug>`.
- `CITY=<slug> npm run deploy:city-data` — package the city, then `deploy-city.sh` uploads it to `DEPLOY_PATH/city.new/` and swaps it in as `DEPLOY_PATH/city/`.
- Both deploys are real deploys to a live device — do not run without explicit user instruction.
- `CITY=<slug> npm run build:city` — build using `.env.<slug>` (box-specific `PUBLIC_*` variables, not city data)
- `build` finishes with `scripts/check-size.js` (fails if `build/` alone is above 64 MB; app + city is checked by `package:city`).

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

**Multi-city: one app build, city data loaded at runtime from `/city/`.** City-specific data lives in `cities/<slug>/` (`city.config.json`, `tiles/` incl. `metadata.json`, `poi/`, optional `locales/` overrides); `cities/_template/` is the starting point. It is never bundled into the app: on the box it sits in `DEPLOY_PATH/city/` next to the app (later possibly supplied by the device image's per-site overlay), locally `scripts/lib/vite-plugin-city.js` serves it under the same path. `scripts/package-city.js` packages a city into `dist/cities/<slug>/` and generates `city.json` (`CityManifest` in `src/lib/types.ts`: runtime config + `schemaVersion` + `dataVersion` content hash + file list); validation shared by all scripts lives in `scripts/lib/city.js`. The root layout (`src/routes/+layout.svelte`) awaits `loadCity()` and `loadTranslations(city.defaultLocale)` before rendering anything; code below it reads city values via `getCity()` and builds URLs with `cityUrl()` from `src/lib/config/city.ts` — never hardcode city coordinates or names, and never import city data. Changing the package layout means bumping `SCHEMA_VERSION` in `scripts/lib/city.js` and `SUPPORTED_SCHEMA_VERSION` in `src/lib/config/city.ts` together. Bounds and center come from the tiles' `metadata.json`, but the tile zoom range (`minzoom`/`maxzoom`) is derived from the zoom folders actually present in `tiles/`, because metadata can claim levels that were left out to save space (e.g. Berlin stops at z13); don't switch this back to metadata, or MapLibre requests missing tiles and the map goes blank instead of overzooming. Optional `mapMaxZoom` in `city.config.json` caps the map's own zoom (must be ≥ the highest tile zoom; `null` = MapLibre default). Optional `mapStyle` (`positron` default, `terrain`) picks the base layer style from `src/lib/config/layer-style-*.ts`; both share the `openmaptiles` source and the Metropolis glyphs in `static/fonts/`. What the map popup shows comes from the city's optional `poi/poi-map.json` (per POI file and property: `label`, `valueToDisplay` `boolean`/`text`/`map`, …; validated by `readPoiMap()` in `scripts/lib/city.js`, shipped in `city.json` as `poiMap`, turned into rows by `src/lib/config/popup.ts`), because each city's POI data can come from a different source with different property names — never hardcode property names of the data in the app. City locale overrides are fetched from `/city/locales/<lang>.json` (a 404 just means none) and deep-merged onto the base locales in `src/lib/translations.js`; base locales must stay city-neutral.

**Two independent data sources, no app-side database:**

1. City data: POI GeoJSON (toilets, drinking water, water pumps, defibrillators) in `cities/<slug>/poi/*.json`, loaded by MapLibre from `/city/poi/*.json` and wired into the map via `src/lib/config/{layers.ts,sources.ts,layer-style-positron.ts}`. Map tiles are self-hosted Mapbox Vector Tiles (MVT, uncompressed), stored in `cities/<slug>/tiles/` and served from `/city/tiles/{z}/{x}/{y}.pbf` — no external tile provider. Tiles are generated outside this repo (vector-tiles-converter) and dropped in by hand.
2. The Kiezbox device's own local API: `src/lib/api.ts` (`apiFetch()`) hits `PUBLIC_API_URL` for `/api/mode`, `/api/admin/setMode`, `/api/session`, and captive-portal endpoints. This is the device's own REST API, not a project backend.

**Map component** (`src/components/Map/Map.svelte`): uses MapLibre GL JS (not Leaflet/Mapbox). Builds a style spec from the local pbf tiles plus the layer/source config above, adds Geolocate/Navigation/Fullscreen controls, and recenters on `NetworkStore.coordinates` reactively (`$effect`) once the device reports a location. Feature clicks write into `poiState` and open a MapLibre `Popup` whose content is the DOM node bound in `PopupCard.svelte` via `mapState.cardRef`. `Legend.svelte` reads `layerState`/layer config to drive visibility toggles.

**Device "mode" is a core domain concept.** `NetworkStore.mode.isEmergency` reflects the physical Kiezbox device's own state and changes app behavior (e.g. call button text/target differs between emergency and demo/normal mode). Don't treat this as ordinary connectivity state — it's reported by the device.

**PWA / offline:** `src/service-worker.ts` is a hand-written SvelteKit service worker (cache-first with network fallback, `SKIP_WAITING` messaging for updates); update-detection UI lives in `src/routes/+layout.svelte`. Two caches: `app-<version>` (precached build files, replaced on every app update) and `city-data` (everything under `/city/`, survives app updates). `/city/city.json` is network-first; when its `dataVersion` differs from the cached one, `city-data` is dropped and all files from the manifest are precached one by one in the background. Other `/city/` files are cache-first. Manifest at `static/manifest.json`.

**i18n:** `sveltekit-i18n`, configured in `src/lib/translations.js`, fallback locale `de`. Locale dictionaries in `src/lib/assets/locales/{de,en,fr,it,es,tr}.json`.

**Shared types:** `src/lib/types.ts` and `src/lib/enums.ts` (e.g. `Mode`, `SIPUser`, `SessionResponse`, `CallState`, `DeviceType`) — reuse these rather than redefining shapes locally.

**Env config:** public env vars via `$env/static/public`: `PUBLIC_API_URL`, `PUBLIC_APP_HOSTNAME`, `PUBLIC_WSS_PATH`, `PUBLIC_USER_PREFIX`, `PUBLIC_LOG_LEVEL`, `PUBLIC_KB_TARGET_URI`, `PUBLIC_KB_DEMO_TARGET_URI`. `PUBLIC_CITY` only selects which `cities/<slug>/` the dev/preview server serves under `/city/` (`CITY_DIR` overrides it); the app code never reads it. All of these must be set (in `.env` or `.env.<slug>`) — without them `npm run check` and `npm run build` fail with missing `$env/static/public` exports.

**UI primitives:** `src/lib/components/ui/**` are generated shadcn-svelte-style primitives (bits-ui + tailwind-variants) — the eslint config deliberately ignores this directory; don't hand-edit generated primitive internals if a config/variant change would do.
