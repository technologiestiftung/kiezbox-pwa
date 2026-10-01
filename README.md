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

## Selecting a City

The app is built for one city at a time. Everything city-specific lives in `cities/<slug>/`:

```
cities/<slug>/
  city.config.json   # name, default locale, optional fallback coordinates, optional mapMaxZoom
  tiles/             # vector tiles {z}/{x}/{y}.pbf (uncompressed) + metadata.json
  poi/               # toilets.json, drinking-water.json, defibrillator.json, water-pumps.json
  locales/           # optional overrides of src/lib/assets/locales/<lang>.json (deep-merged)
```

Set the city with `PUBLIC_CITY=<slug>` (in `.env` or `.env.<slug>`). Before `dev`, `build` and `check`, `scripts/prepare-city.js` copies the city into `static/pbf-tiles/` and `src/lib/generated/` (both gitignored). Map bounds and center are read from `tiles/metadata.json`. The tile zoom range is taken from the zoom folders actually present in `tiles/`, so a tileset can stop at e.g. z13 to save space: the map overzooms the highest level instead of requesting missing tiles. `mapMaxZoom` (optional, ≥ highest tile zoom) caps how far users can zoom in; `null` keeps the MapLibre default.

### Adding a new city

1. Copy `cities/_template/` to `cities/<slug>/` (lowercase letters, digits and `-` only).
2. Put the tiles generated with the vector-tiles-converter, plus their `metadata.json`, into `tiles/`.
3. Export the POIs (e.g. via overpass turbo) as GeoJSON into `poi/`. Empty FeatureCollections are fine.
4. Fill in `city.config.json` and the locale overrides (local fire brigade, poison control centre).
5. Create `.env.<slug>` with `PUBLIC_CITY=<slug>` and the box-specific variables (API URL, hostname, SIP targets, deploy target).
6. Run `CITY=<slug> npm run build:city`. The build fails if it exceeds the 64 MB limit of the box.

## Running the Project

To start a local development server, use the following command:

```bash
npm run dev
```

## Building for Production

To build the project run:

```bash
npm run build
# or for a specific city, using .env.<slug>
CITY=solingen npm run build:city
```

## Usage or Deployment

`deploy.sh` uploads `build/` to the box via scp. It needs `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` and `DEPLOY_PASSWORD` in the environment (never commit real values):

```bash
CITY=solingen npm run deploy:city
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

## Related Projects
