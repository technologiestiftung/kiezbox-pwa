# Deployment

Die App und die Stadtdaten sind zwei getrennte Artefakte:

- **App** – einmal gebaut, auf allen Boxen gleich, enthält keine Stadtdaten.
- **City-Ordner** – pro Stadt, liegt als Overlay neben der App unter `city/`.

## Struktur auf der Box

```
DEPLOY_PATH/
├── index.html, _app/, fonts/, …   ← aus build/              (gleich auf allen Boxen)
├── box.json                       ← Werte dieser Box (Overlay pro Box, Vorlage box.example.json)
└── city/                          ← aus dist/cities/<slug>/ (Overlay pro Stadt)
    ├── city.json                  ← Manifest (wird von package:city erzeugt)
    ├── city.config.json
    ├── tiles/
    ├── poi/
    └── locales/                   (optional)
```

Die App lädt beim Start `/city/city.json` und alles Weitere über `/city/…`.

### `box.json`

Box-spezifische Werte, die die App beim Start aus `/box.json` liest. So braucht nicht jede Box einen eigenen Build:

```json
{ "targetUri": "sip:…", "demoTargetUri": "sip:…" }
```

- `targetUri`: SIP-Ziel im Notfallmodus, `demoTargetUri`: SIP-Ziel im Demo-/Normalmodus.
- Fehlt die Datei oder ein Feld, gelten `PUBLIC_KB_TARGET_URI` / `PUBLIC_KB_DEMO_TARGET_URI` aus dem Build.
- **Jedes Handy im WLAN kann die Datei abrufen. Keine Passwörter oder Tokens eintragen.**
- Wird nicht von einem Deploy-Skript erzeugt. Sie kommt über das Image-Overlay oder wird von Hand per `scp` abgelegt. `deploy.sh` lässt sie stehen.

## Bauen

### App

```sh
npm run build                # → build/
CITY=<slug> npm run build:city   # dasselbe, aber mit den PUBLIC_*-Variablen aus .env.<slug>
```

- Ergebnis: `build/` (stadtneutral).
- `check-size.js` bricht ab, wenn `build/` größer als 64 MB ist.

### City-Ordner

```sh
npm run package:city -- <slug>   # cities/<slug>/ → dist/cities/<slug>/
```

- Validiert `cities/<slug>/`, kopiert die Daten und erzeugt `city.json` (Konfiguration, `schemaVersion`, `dataVersion`-Hash, Dateiliste).
- Prüft, dass `build/` + Stadtdaten zusammen unter 64 MB bleiben – also vorher `npm run build` ausführen.
- Neue Städte starten als Kopie von `cities/_template/`.

## Deployen

> Alle drei Befehle deployen auf eine echte Box. Nur bewusst ausführen.

| Befehl                                 | Was passiert                                                               |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `npm run deploy`                       | Baut die App und lädt `build/` nach `DEPLOY_PATH/` hoch (Ziel aus `.env`). |
| `CITY=<slug> npm run deploy:city`      | Dasselbe, mit Ziel und `PUBLIC_*`-Variablen aus `.env.<slug>`.             |
| `CITY=<slug> npm run deploy:city-data` | Packt die Stadt und lädt sie nach `DEPLOY_PATH/city/` hoch.                |

- **App-Deploy** (`deploy.sh`): löscht alles in `DEPLOY_PATH` **außer** `city/` und `box.json` und lädt dann `build/` hoch. Die Stadtdaten bleiben erhalten.
- **City-Deploy** (`deploy-city.sh`): lädt nach `city.new/` hoch und tauscht erst danach gegen `city/` aus – die Box liefert nie halb kopierte Daten aus.

**`CITY` bei `deploy:city` heißt eigentlich „Box“:** Es wählt nur `.env.<slug>`, also das Deploy-Ziel und die `PUBLIC_*`-Werte dieser Box. Stadtdaten kommen dabei nicht in den Build. Sind die `PUBLIC_*`-Werte auf allen Boxen gleich, ist der Build überall identisch, und `CITY` bestimmt nur, wohin hochgeladen wird.

App und Stadtdaten lassen sich daher unabhängig voneinander aktualisieren. Auch der Service Worker trennt die beiden: `app-<version>` wird bei jedem App-Update ersetzt, `city-data` nur, wenn sich `dataVersion` in `city.json` ändert.

### Erstes Aufsetzen einer Box

```sh
CITY=<slug> npm run deploy:city         # App (CITY wählt nur Ziel-Box + PUBLIC_*-Werte)
CITY=<slug> npm run deploy:city-data    # Stadtdaten
```

## Umgebungsvariablen

In `.env` bzw. `.env.<slug>` (Vorlage: `.env.example`, echte Werte nie committen):

| Variable                                                                                                                                                  | Zweck                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_PASSWORD`                                                                                            | Deploy-Ziel.                                                                                                                                                            |
| `PUBLIC_API_URL`, `PUBLIC_APP_HOSTNAME`, `PUBLIC_WSS_PATH`, `PUBLIC_USER_PREFIX`, `PUBLIC_LOG_LEVEL`, `PUBLIC_KB_TARGET_URI`, `PUBLIC_KB_DEMO_TARGET_URI` | Werden **beim Build fest in die App geschrieben**. Ohne sie schlagen `build` und `check` fehl. Die beiden `PUBLIC_KB_*`-Ziele sind nur Fallback, wenn `box.json` fehlt. |
| `PUBLIC_CITY`                                                                                                                                             | Nur lokal: welche `cities/<slug>/` `dev`/`preview` unter `/city/` ausliefern. Landet nicht im Build.                                                                    |
| `CITY_DIR`                                                                                                                                                | Nur lokal: überschreibt `PUBLIC_CITY`, z. B. `dist/cities/berlin`.                                                                                                      |

**Achtung:** Weil die `PUBLIC_*`-Werte im Build stecken (außer den SIP-Zielen, die `box.json` überschreibt), funktioniert „eine App für alle Boxen“ nur, solange diese Werte auf allen Boxen gleich sind. Sonst braucht jede Box einen eigenen App-Build.

## Lokal testen

```sh
npm run dev                                         # /city/ aus cities/<PUBLIC_CITY>/
npm run build && npm run package:city -- berlin
CITY_DIR=dist/cities/berlin npm run preview         # wie auf der Box: gebaute App + gepackte Stadt
```

## Offen

Später soll der City-Ordner als Overlay pro Standort mit dem Geräte-Image ausgeliefert werden. Der Pfad `DEPLOY_PATH/city/` ist schon so ausgelegt.
