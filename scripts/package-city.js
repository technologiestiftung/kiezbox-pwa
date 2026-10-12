// Validates cities/<slug>/ and packages it as the city data the app loads at runtime from /city/:
//   dist/cities/<slug>/
//     city.config.json, locales/, poi/, tiles/   (copied unchanged)
//     city.json                                  (generated manifest, see toManifest())
// Usage: npm run package:city -- <slug>   (falls back to PUBLIC_CITY)
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	CityError,
	LIMIT_MB,
	MANIFEST_FILE,
	MB,
	WARN_MB,
	listFiles,
	notIgnored,
	readCity,
	toManifest,
	totalSize
} from './lib/city.js';

const root = join(import.meta.dirname, '..');
const slug = process.argv[2] ?? process.env.PUBLIC_CITY;

/** @param {string} message */
function fail(message) {
	console.error(`\n✖ package-city: ${message}\n`);
	process.exit(1);
}

if (!slug) {
	fail('Keine Stadt angegeben. Aufruf: npm run package:city -- <stadt> (oder PUBLIC_CITY setzen).');
}

const cityDir = join(root, 'cities', slug);
let city;
try {
	city = readCity(cityDir, slug);
} catch (error) {
	if (error instanceof CityError) fail(error.message);
	throw error;
}

const outDir = join(root, 'dist/cities', slug);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const entry of ['city.config.json', 'locales', 'poi', 'tiles']) {
	if (!existsSync(join(cityDir, entry))) continue;
	cpSync(join(cityDir, entry), join(outDir, entry), { recursive: true, filter: notIgnored });
}

// Changes whenever any packaged file changes; lets the service worker tell new city data from old
const files = listFiles(outDir);
const hash = createHash('sha256');
for (const file of files) {
	hash
		.update(file)
		.update('\0')
		.update(readFileSync(join(outDir, file)))
		.update('\0');
}
const dataVersion = hash.digest('hex').slice(0, 16);

writeFileSync(
	join(outDir, MANIFEST_FILE),
	JSON.stringify(toManifest(city, files, dataVersion), null, '\t') + '\n'
);

const format = (/** @type {number} */ bytes) => `${(bytes / MB).toFixed(1)} MB`;
const total = totalSize(outDir, listFiles(outDir));
/** @type {Map<number, number>} */
const tilesPerZoom = new Map();
for (const file of files) {
	const [first, zoom] = file.split('/');
	if (first === 'tiles' && /^\d+$/.test(zoom)) {
		tilesPerZoom.set(
			Number(zoom),
			(tilesPerZoom.get(Number(zoom)) ?? 0) + totalSize(outDir, [file])
		);
	}
}

console.log(`\nStadtpaket ${city.name} (${slug}): ${format(total)}, ${files.length} Dateien`);
for (const [zoom, size] of [...tilesPerZoom].sort(([a], [b]) => a - b)) {
	console.log(`  z${zoom}: ${format(size)}`);
}

// App and city data share the device's storage, so check them together if the app is built
const buildDir = join(root, 'build');
const appSize = existsSync(buildDir) ? totalSize(buildDir, listFiles(buildDir)) : null;
const combined = total + (appSize ?? 0);
if (appSize === null) {
	console.warn(`\n⚠ build/ fehlt, geprüft wird nur das Stadtpaket. Für App + Stadt: npm run build`);
} else {
	console.log(
		`App (build/): ${format(appSize)}, zusammen ${format(combined)} (Limit ${LIMIT_MB} MB)`
	);
}
if (combined > LIMIT_MB * MB) {
	fail(
		`App + Stadtpaket sind größer als ${LIMIT_MB} MB. Tiles mit niedrigerem maxzoom neu erzeugen.`
	);
}
if (combined > WARN_MB * MB) {
	console.warn(
		`\n⚠ App + Stadtpaket sind größer als ${WARN_MB} MB, nur noch wenig Puffer bis zum Limit.`
	);
}

console.log(`\n✔ package-city: ${outDir.replace(`${root}/`, '')} (dataVersion ${dataVersion})`);
