![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Kiezbox Notfall App

The Kiezbox Emergency App is a progressive web app (PWA) build with SvelteKit and SSG that is specially developed for the use on a BananaPi. It enables offline communication and supports SIP-based VoIP calls for contacting emergency services, even with a limited or no internet connection.

Below are setup instructions for running the project locally and steps for deploying it.

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18 or higher)
- **npm** (usually included with Node.js)

## Installation

1. **Clone the Repository**

```bash
git clone git@github.com:technologiestiftung/kiezbox-multi-city-pwa.git
cd kiezbox-multi-city-pwa
```

2. **Install Dependencies**

Run the following command to install all necessary packages:

```bash
npm install
```

## Cities

The app build is the same for every city. The city data is not part of it: the app loads it at runtime from `/city/` (on the box: `${DEPLOY_PATH}/city/`, next to the app). App and city data are therefore deployed and updated independently, and the service worker caches them separately, so an app update does not make phones download the map again.

Everything city-specific lives in `cities/<slug>/`:

```
cities/<slug>/
  city.config.json   # name, default locale, optional fallback coordinates, optional mapMaxZoom, mapStyle
  tiles/             # vector tiles {z}/{x}/{y}.pbf (uncompressed) + metadata.json
  poi/               # toilets.json, drinking-water.json, defibrillator.json, water-pumps.json
                     # + optional poi-map.json: which properties the map popup shows
  locales/           # optional overrides of src/lib/assets/locales/<lang>.json (deep-merged)
```

`npm run package:city -- <slug>` validates a city and packages it into `dist/cities/<slug>/` (gitignored), including a generated `city.json`: the runtime config plus a `dataVersion` hash that tells the service worker when the city data changed. It fails if app (`build/`) + city data exceed the 64 MB limit of the box. Map bounds and center are read from `tiles/metadata.json`. The tile zoom range is taken from the zoom folders actually present in `tiles/`, so a tileset can stop at e.g. z13 to save space: the map overzooms the highest level instead of requesting missing tiles. `mapMaxZoom` (optional, ≥ highest tile zoom) caps how far users can zoom in; `null` keeps the MapLibre default.

### Map popup: `poi/poi-map.json`

The POI data of each city can come from anywhere (OSM, an open data portal, …) and use different property names and values, so the city folder describes what they mean, not the app. Per POI file (name without `.json`) and per property of its features, one popup row, in this order:

```jsonc
{
	"toilets": {
		"barrierefrei": {
			"label": "wheelchair",
			"valueToDisplay": "boolean",
			"truthy": "ja",
			"falsy": "nein"
		},
		"nutzungsentgelt": { "label": "free", "valueToDisplay": "boolean", "truthy": 0 }
	},
	"water-pumps": {
		"pump:status": {
			"label": "status",
			"valueToDisplay": "map",
			"values": { "ok": "working", "broken": "broken" },
			"fallback": "unknown"
		},
		"check_date": { "label": "check_date", "valueToDisplay": "text" }
	},
	"defibrillator": {
		"phone": {
			"label": "phone",
			"valueToDisplay": "text",
			"alsoTry": ["contact:phone"],
			"fallback": "unknown"
		}
	}
}
```

- `boolean`: ✓ if the value is in `truthy`; ✗ if it is in `falsy`, or for any other value if `falsy` is not set. `truthy`/`falsy` can be a string, a number or a list; values are compared case-insensitively as text.
- `text`: the value as it is.
- `map`: the entry of `values` for the value; values not listed are shown as they are.
- `alsoTry` (optional): further properties to read, in order, if the property itself is empty.
- `fallback` (optional, `text`/`map`): shown when the property is empty. Without it, empty properties get no row (always for `boolean`).
- `label` is a translation key below `map.popup.labels`, `values` entries and `fallback` below `map.popup.values` (base locales: `free`, `wheelchair`, `changing_table`, `status`, `drinking_water`, `check_date`, `opening_hours`, `location`, `phone`, `operator` / `working`, `broken`, `unknown`). New keys go into the city's `locales/`; text without a matching key is shown as it is.

The file is optional (no file or `{}` for a POI = popup shows only the title). `package:city` validates it and copies it into `city.json` as `poiMap`.

### Adding a new city

Step-by-step guide (German): [cities/README.md](cities/README.md).

1. Copy `cities/_template/` to `cities/<slug>/` (lowercase letters, digits and `-` only).
2. Put the tiles generated with the vector-tiles-converter, plus their `metadata.json`, into `tiles/`.
3. Export the POIs (e.g. via overpass turbo) as GeoJSON into `poi/`. Empty FeatureCollections are fine. Describe in `poi/poi-map.json` which of their properties the popup shows (see above).
4. Fill in `city.config.json` and the locale overrides (local fire brigade, poison control centre).
5. Create `.env.<slug>` with `PUBLIC_CITY=<slug>` and the box-specific variables (API URL, hostname, SIP targets, deploy target).
6. Run `npm run package:city -- <slug>` and fix whatever it reports.

## Running the Project

`npm run dev` and `npm run preview` serve `/city/` themselves (`scripts/lib/vite-plugin-city.js`), from `cities/<PUBLIC_CITY>/`, or from `CITY_DIR` if set:

```bash
# development, city data read directly from cities/berlin/ (edits show up on reload)
PUBLIC_CITY=berlin npm run dev

# production build + a packaged city, i.e. what ends up on the box
npm run build
npm run package:city -- berlin
CITY_DIR=dist/cities/berlin npm run preview
```

Switching the city only needs a restart of the dev/preview server, not a new build.

## Building for Production

```bash
npm run build
# or with the box-specific variables from .env.<slug>
CITY=solingen npm run build:city
```

## Usage or Deployment

App and city data are deployed separately via scp. Both need `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` and `DEPLOY_PASSWORD` in the environment (never commit real values):

```bash
# app: build/ -> ${DEPLOY_PATH}/ (keeps ${DEPLOY_PATH}/city/)
CITY=solingen npm run deploy:city

# city data: package cities/solingen/ -> ${DEPLOY_PATH}/city/ (swapped in only after the upload)
CITY=solingen npm run deploy:city-data
```

## Development

tbd...

## Tests

tbd...

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https:/github.com/LuiseBrandenburger"><img src="https://avatars.githubusercontent.com/u/61413319?s=?s=64" width="64px;" alt="Luise Brandenburger"/><br /><sub><b>Luise Brandenburger</b></sub></a><br /><a href="https://github.com/technologiestiftung/kiezbox-pwa/commits?author=LuiseBrandenburger" title="Documentation">📖</a> <a href="https://github.com/technologiestiftung/kiezbox-pwa/commits?author=LuiseBrandenburger" title="Code">💻</a> <a href="https://github.com/technologiestiftung/kiezbox-pwa/pulls?q=is%3Apr+reviewed-by%3ALuiseBrandenburger" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

Illustrations by {MARIA_MUSTERFRAU}, all rights reserved.

## Credits

<table>
  <tr>
    <td>
      Made by  <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-berlin.svg" />
      </a>
    </td>
  </tr>
</table>
