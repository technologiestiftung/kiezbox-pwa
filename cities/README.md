# Städte

Die App ist für alle Städte dieselbe. Alles, was eine Stadt ausmacht (Karte, POIs, Texte), liegt hier in `cities/<stadt>/` und wird **nicht** in die App eingebaut: Auf der Kiezbox liegt es in `DEPLOY_PATH/city/` neben der App, und die App lädt es beim Start unter `/city/`. Stadtdaten und App lassen sich deshalb unabhängig voneinander aktualisieren.

```
cities/<stadt>/
  city.config.json     Name, Standardsprache, optional Ersatzkoordinaten und maximale Zoomstufe
  tiles/               Kartenkacheln {z}/{x}/{y}.pbf + metadata.json
  poi/                 toilets.json, drinking-water.json, defibrillator.json, water-pumps.json
    poi-map.json       optional: was das Popup auf der Karte zu einem POI anzeigt
  locales/             optional: stadtspezifische Texte (z. B. Feuerwehr, Giftnotruf)
```

`_template/` ist die Vorlage für neue Städte, `berlin/` und `solingen/` sind vollständige Beispiele.

## Neue Stadt hinzufügen

### 1. Ordner anlegen

`_template/` nach `cities/<stadt>/` kopieren. Der Ordnername ist der „Slug“ der Stadt und darf nur **Kleinbuchstaben, Ziffern und `-`** enthalten (also `koeln`, nicht `Köln`).

### 2. Kartenkacheln (`tiles/`)

Die mit dem `vector-tiles-converter` erzeugten Kacheln samt `metadata.json` nach `tiles/` legen: `tiles/<z>/<x>/<y>.pbf`, **unkomprimiert** (kein gzip).

- Kartenausschnitt (`bounds`) und Mittelpunkt (`center`) werden aus `metadata.json` gelesen.
- Welche Zoomstufen es gibt, ergibt sich aus den Ordnern `0/`, `1/`, … in `tiles/`, nicht aus `metadata.json`. Man kann also hohe Zoomstufen weglassen, um Platz zu sparen (Berlin endet bei z13). Die Karte vergrößert dann einfach die höchste vorhandene Stufe.
- **Speicherlimit:** App und Stadtdaten zusammen dürfen höchstens **64 MB** groß sein, ab 50 MB gibt es eine Warnung. Die Kacheln sind fast immer der größte Teil. Wird es zu groß, die Kacheln mit niedrigerem maxzoom neu erzeugen.

### 3. POIs (`poi/`)

Die vier Dateien in `poi/` durch GeoJSON-Daten der Stadt ersetzen (z. B. aus OpenStreetMap per overpass turbo oder aus dem Open-Data-Portal der Stadt). Zu beachten:

- Die Dateinamen müssen genau so bleiben: `toilets.json`, `drinking-water.json`, `defibrillator.json`, `water-pumps.json`.
- Alle vier müssen vorhanden sein. Gibt es für eine Art keine Daten, bleibt eine leere FeatureCollection stehen (`{ "type": "FeatureCollection", "features": [] }`).
- Koordinaten in WGS84 (Längengrad, Breitengrad), wie bei GeoJSON üblich.
- Die Dateien kommen 1:1 auf die Box. Unnötig große Exporte (viele ungenutzte Attribute) kosten Speicher.

### 4. Popup-Inhalte (`poi/poi-map.json`)

Klickt man auf der Karte auf einen POI, zeigt ein Popup Details wie „Barrierefrei ✓“ oder „Öffnungszeiten“. Die Daten jeder Stadt kommen aus anderen Quellen und haben andere Attributnamen und Werte: In OSM heißt es `wheelchair: "yes"`, in den Berliner Toilettendaten `barrierefrei: "ja"`. Deshalb steht in `poi-map.json`, welches Attribut was bedeutet. Die App selbst kennt keine Attributnamen.

Erst in die eigenen Daten schauen, welche Attribute und Werte es gibt, dann pro POI-Datei (Name ohne `.json`) und pro Attribut eine Zeile des Popups beschreiben. Die Reihenfolge in der Datei ist die Reihenfolge im Popup.

```json
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
	},
	"drinking-water": {}
}
```

**`valueToDisplay`**, wie der Wert angezeigt wird:

| Typ       | Anzeige                                                                                                        | Pflichtfelder     |
| --------- | -------------------------------------------------------------------------------------------------------------- | ----------------- |
| `boolean` | ✓ wenn der Wert in `truthy` steht; ✗ wenn er in `falsy` steht, oder bei jedem anderen Wert, wenn `falsy` fehlt | `label`, `truthy` |
| `text`    | der Wert, so wie er in den Daten steht (z. B. Öffnungszeiten, Datum)                                           | `label`           |
| `map`     | der passende Eintrag aus `values`; Werte, die dort nicht stehen, werden unverändert angezeigt                  | `label`, `values` |

**Weitere Felder:**

- `truthy` / `falsy`: ein Text, eine Zahl oder eine Liste davon, z. B. `["yes", "designated"]`. Groß-/Kleinschreibung ist egal, `0` passt auch auf `"0"`.
- `alsoTry` (optional): weitere Attribute, die der Reihe nach gelesen werden, wenn das erste leer ist.
- `fallback` (optional, nur `text` und `map`): wird angezeigt, wenn das Attribut leer ist, z. B. `"unknown"`. Ohne `fallback` fällt die Zeile dann weg. Bei `boolean` fällt sie immer weg (lieber keine Angabe als ein falsches ✗).

**Texte und Übersetzungen:** `label` sowie die Einträge in `values` und `fallback` sind Übersetzungsschlüssel, damit das Popup in allen Sprachen der App erscheint. Vorhanden sind:

- Labels (`map.popup.labels`): `free`, `wheelchair`, `changing_table`, `status`, `drinking_water`, `check_date`, `opening_hours`, `location`, `phone`, `operator`
- Werte (`map.popup.values`): `working`, `broken`, `unknown`

Braucht die Stadt weitere Schlüssel, diese in `locales/<sprache>.json` der Stadt ergänzen (siehe Schritt 6), z. B. `{ "map": { "popup": { "labels": { "urinal": "Pissoir" } } } }`. Text, für den es keinen Schlüssel gibt, wird so angezeigt, wie er in `poi-map.json` steht, dann aber in jeder Sprache gleich.

`poi-map.json` ist optional. Fehlt die Datei oder steht bei einem POI `{}`, zeigt das Popup nur den Titel.

### 5. `city.config.json`

```json
{
	"name": "Köln",
	"defaultLocale": "de",
	"fallbackCoordinates": null,
	"mapMaxZoom": 18
}
```

- `name`: Anzeigename der Stadt.
- `defaultLocale`: Sprache beim ersten Start: `de`, `en`, `fr`, `it`, `es` oder `tr`.
- `fallbackCoordinates`: `[längengrad, breitengrad]`, auf die die Karte zentriert, solange die Box keine GPS-Position meldet. `null` bedeutet: Mittelpunkt aus `tiles/metadata.json`.
- `mapMaxZoom`: wie weit man hineinzoomen kann. Muss mindestens so groß sein wie die höchste vorhandene Kachel-Zoomstufe. `null` bedeutet: Standard von MapLibre.

### 6. Stadtspezifische Texte (`locales/`)

Die App hat neutrale Texte für alle Sprachen. In `locales/<sprache>.json` werden nur die Stellen überschrieben, die für die Stadt anders sind. Die Datei wird mit den Basistexten zusammengeführt, sie muss also nur die geänderten Schlüssel enthalten. Die Vorlage enthält die Stellen, die jede Stadt anpassen muss:

- `content.emergency_phone.emergency.offline.text`: Name der zuständigen Feuerwehr
- `content.precaution_infos.cbrn.2.text`: zuständige Giftnotrufzentrale mit Telefonnummer

Alle `<Platzhalter>` ersetzen. Fehlt eine Sprache, gelten dort die neutralen Texte. Die Basistexte liegen in `src/lib/assets/locales/` und dürfen keine stadtspezifischen Angaben enthalten.

### 7. Prüfen und lokal ansehen

```bash
npm run package:city -- <stadt>
```

Das prüft den Ordner und meldet Probleme verständlich, z. B. fehlende Dateien, falsche Zoomangaben, Tippfehler in `poi-map.json` oder ein zu großes Paket. Anschließend die Stadt lokal ansehen:

```bash
PUBLIC_CITY=<stadt> npm run dev
```

Für `dev` müssen die `PUBLIC_*`-Variablen in `.env` gesetzt sein (siehe `.env.example`). Änderungen an den Stadtdaten sind nach einem Neuladen der Seite sichtbar. Für eine andere Stadt muss nur der Dev-Server neu gestartet werden, die App muss nicht neu gebaut werden.

Zum Durchklicken: Karte zentriert richtig, alle vier POI-Arten erscheinen, Popups zeigen sinnvolle Werte (kein durchgehendes ✗, keine „unbekannt“-Wüste), Feuerwehr- und Giftnotruftexte stimmen in allen Sprachen.

### 8. Box-Konfiguration (`.env.<stadt>`)

Für die Box der Stadt im Projektordner eine `.env.<stadt>` anlegen (Vorlage: `.env.example`) mit `PUBLIC_CITY=<stadt>`, den Box-Adressen und SIP-Zielen sowie dem Deploy-Ziel (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_PASSWORD`). Die Datei ist per `.gitignore` ausgeschlossen und darf **nicht** eingecheckt werden, weil sie Zugangsdaten enthält.

### 9. Auf die Box bringen

Das sind echte Deployments auf ein laufendes Gerät, also nur bewusst ausführen:

```bash
# App (einmalig bzw. bei App-Updates)
CITY=<stadt> npm run deploy:city

# Stadtdaten (bei jeder Änderung in cities/<stadt>/)
CITY=<stadt> npm run deploy:city-data
```

Die Stadtdaten werden erst vollständig hochgeladen und dann ausgetauscht, die Box zeigt also nie halbe Daten. Handys, die die App schon offline gespeichert haben, erkennen geänderte Stadtdaten automatisch und laden sie im Hintergrund neu.

## Gut zu wissen

- **Nie** Stadtdaten in `src/` ablegen oder im App-Code Koordinaten, Stadtnamen oder POI-Attributnamen festschreiben. Alles Stadtspezifische gehört in diesen Ordner.
- `dist/cities/<stadt>/` ist das erzeugte Paket (nicht eingecheckt). Bearbeitet wird immer `cities/<stadt>/`.
- Ändert sich der Aufbau eines Stadtordners grundsätzlich (neue Pflichtdateien o. Ä.), müssen `SCHEMA_VERSION` in `scripts/lib/city.js` und `SUPPORTED_SCHEMA_VERSION` in `src/lib/config/city.ts` gemeinsam erhöht werden.
