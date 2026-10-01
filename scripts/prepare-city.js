// Copies the city selected via PUBLIC_CITY from cities/<slug>/ into the places the app reads from:
//   cities/<slug>/tiles   -> static/pbf-tiles/
//   cities/<slug>/poi     -> src/lib/generated/poi/
//   cities/<slug>/locales -> src/lib/generated/locales/
//   city.config.json + tiles/metadata.json -> src/lib/generated/city.json
// All targets are gitignored build artefacts.
import 'dotenv/config';
import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { basename, join } from 'node:path';

const POI_FILES = ['toilets.json', 'drinking-water.json', 'defibrillator.json', 'water-pumps.json'];
const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

const root = join(import.meta.dirname, '..');
const slug = process.env.PUBLIC_CITY;

function fail(message) {
	console.error(`\n✖ prepare-city: ${message}\n`);
	process.exit(1);
}

if (!slug) {
	fail('PUBLIC_CITY ist nicht gesetzt (z. B. PUBLIC_CITY=solingen in .env oder .env.<stadt>).');
}

const cityDir = join(root, 'cities', slug);
if (!/^[a-z0-9-]+$/.test(slug) || !existsSync(cityDir)) {
	fail(`Stadt "${slug}" nicht gefunden. Erwartet wird der Ordner cities/${slug}/.`);
}

const required = [
	'city.config.json',
	'tiles/metadata.json',
	...POI_FILES.map((file) => `poi/${file}`)
];
const missing = required.filter((file) => !existsSync(join(cityDir, file)));
if (missing.length > 0) {
	fail(`In cities/${slug}/ fehlen: ${missing.join(', ')}`);
}

const cityConfig = JSON.parse(readFileSync(join(cityDir, 'city.config.json'), 'utf8'));
const metadata = JSON.parse(readFileSync(join(cityDir, 'tiles/metadata.json'), 'utf8'));

const bounds = String(metadata.bounds ?? '')
	.split(',')
	.map(Number);
const center = String(metadata.center ?? '')
	.split(',')
	.map(Number);
if (bounds.length !== 4 || bounds.some(Number.isNaN)) {
	fail(`tiles/metadata.json: "bounds" muss "minLon,minLat,maxLon,maxLat" sein.`);
}
if (center.length < 2 || center.some(Number.isNaN)) {
	fail(`tiles/metadata.json: "center" muss "lon,lat[,zoom]" sein.`);
}

// The zoom levels actually present in tiles/ win over metadata.json: if metadata claims a higher
// maxzoom than exists (e.g. z14 left out to save space), MapLibre would request missing tiles
// and the map turns blank instead of overzooming the highest available level.
const zoomLevels = readdirSync(join(cityDir, 'tiles'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
	.map((entry) => Number(entry.name));
if (zoomLevels.length === 0) {
	fail(`In cities/${slug}/tiles/ gibt es keine Zoomstufen-Ordner (0, 1, 2, …).`);
}
const minzoom = Math.min(...zoomLevels);
const maxzoom = Math.max(...zoomLevels);
for (const [key, actual] of [
	['minzoom', minzoom],
	['maxzoom', maxzoom]
]) {
	if (metadata[key] !== undefined && Number(metadata[key]) !== actual) {
		console.warn(
			`⚠ prepare-city: tiles/metadata.json sagt ${key} ${metadata[key]}, vorhanden ist ${actual}. Verwende ${actual}.`
		);
	}
}

const mapMaxZoom = cityConfig.mapMaxZoom ?? null;
if (mapMaxZoom !== null && (typeof mapMaxZoom !== 'number' || mapMaxZoom < maxzoom)) {
	fail(`city.config.json: "mapMaxZoom" muss eine Zahl ≥ ${maxzoom} (höchste Tile-Zoomstufe) sein.`);
}

const city = {
	slug,
	name: cityConfig.name ?? slug,
	defaultLocale: cityConfig.defaultLocale ?? 'de',
	bounds,
	center: [center[0], center[1]],
	minzoom,
	maxzoom,
	mapMaxZoom,
	fallbackCoordinates: cityConfig.fallbackCoordinates ?? [center[0], center[1]]
};

const notIgnored = (src) => !IGNORED_FILES.includes(basename(src));

const tilesTarget = join(root, 'static/pbf-tiles');
rmSync(tilesTarget, { recursive: true, force: true });
cpSync(join(cityDir, 'tiles'), tilesTarget, { recursive: true, filter: notIgnored });

const generatedDir = join(root, 'src/lib/generated');
rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(generatedDir, { recursive: true });
cpSync(join(cityDir, 'poi'), join(generatedDir, 'poi'), { recursive: true, filter: notIgnored });
mkdirSync(join(generatedDir, 'locales'), { recursive: true });
if (existsSync(join(cityDir, 'locales'))) {
	cpSync(join(cityDir, 'locales'), join(generatedDir, 'locales'), {
		recursive: true,
		filter: notIgnored
	});
}
writeFileSync(join(generatedDir, 'city.json'), JSON.stringify(city, null, '\t') + '\n');

console.log(`✔ prepare-city: ${city.name} (${slug}) vorbereitet`);
