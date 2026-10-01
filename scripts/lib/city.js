// Shared by package-city.js, check-size.js and the /city/ middleware in vite.config.ts:
// validates a city folder (cities/<slug>/ layout) and derives the runtime city config from it.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

/** Bumped whenever the layout of a city package changes in a way the app has to know about */
export const SCHEMA_VERSION = 1;

export const POI_FILES = [
	'toilets.json',
	'drinking-water.json',
	'defibrillator.json',
	'water-pumps.json'
];
const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

/** Storage limit of the Kiezbox device for app + city data */
export const LIMIT_MB = 64;
export const WARN_MB = 50;
export const MB = 1024 * 1024;

/** @param {string} path */
export const notIgnored = (path) => !IGNORED_FILES.includes(basename(path));

export class CityError extends Error {}

/** @param {string} slug */
export const isValidSlug = (slug) => /^[a-z0-9-]+$/.test(slug);

/**
 * Validates cities/<slug>/ (or a city package with the same layout) and returns the city config
 * the app reads at runtime. Throws a CityError with a user-facing message if something is wrong.
 * @param {string} cityDir
 * @param {string} slug
 * @returns {import('../../src/lib/types').CityConfig}
 */
export function readCity(cityDir, slug) {
	const shownDir = `${relative(process.cwd(), cityDir) || '.'}/`;
	if (!isValidSlug(slug) || !existsSync(cityDir)) {
		throw new CityError(`Stadt "${slug}" nicht gefunden. Erwartet wird der Ordner ${shownDir}.`);
	}

	const required = [
		'city.config.json',
		'tiles/metadata.json',
		...POI_FILES.map((file) => `poi/${file}`)
	];
	const missing = required.filter((file) => !existsSync(join(cityDir, file)));
	if (missing.length > 0) {
		throw new CityError(`In ${shownDir} fehlen: ${missing.join(', ')}`);
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
		throw new CityError(`tiles/metadata.json: "bounds" muss "minLon,minLat,maxLon,maxLat" sein.`);
	}
	if (center.length < 2 || center.some(Number.isNaN)) {
		throw new CityError(`tiles/metadata.json: "center" muss "lon,lat[,zoom]" sein.`);
	}

	// The zoom levels actually present in tiles/ win over metadata.json: if metadata claims a higher
	// maxzoom than exists (e.g. z14 left out to save space), MapLibre would request missing tiles
	// and the map turns blank instead of overzooming the highest available level.
	const zoomLevels = readdirSync(join(cityDir, 'tiles'), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
		.map((entry) => Number(entry.name));
	if (zoomLevels.length === 0) {
		throw new CityError(`In ${shownDir}tiles/ gibt es keine Zoomstufen-Ordner (0, 1, 2, …).`);
	}
	const minzoom = Math.min(...zoomLevels);
	const maxzoom = Math.max(...zoomLevels);
	for (const [key, actual] of /** @type {const} */ ([
		['minzoom', minzoom],
		['maxzoom', maxzoom]
	])) {
		if (metadata[key] !== undefined && Number(metadata[key]) !== actual) {
			console.warn(
				`⚠ ${slug}: tiles/metadata.json sagt ${key} ${metadata[key]}, vorhanden ist ${actual}. Verwende ${actual}.`
			);
		}
	}

	const mapMaxZoom = cityConfig.mapMaxZoom ?? null;
	if (mapMaxZoom !== null && (typeof mapMaxZoom !== 'number' || mapMaxZoom < maxzoom)) {
		throw new CityError(
			`city.config.json: "mapMaxZoom" muss eine Zahl ≥ ${maxzoom} (höchste Tile-Zoomstufe) sein.`
		);
	}

	return {
		slug,
		name: cityConfig.name ?? slug,
		defaultLocale: cityConfig.defaultLocale ?? 'de',
		bounds: /** @type {[number, number, number, number]} */ (bounds),
		center: [center[0], center[1]],
		minzoom,
		maxzoom,
		mapMaxZoom,
		fallbackCoordinates: cityConfig.fallbackCoordinates ?? [center[0], center[1]]
	};
}

/** Name of the generated manifest the app loads from /city/ */
export const MANIFEST_FILE = 'city.json';

/**
 * The manifest served as /city/city.json: runtime config plus what the service worker needs to
 * cache the city data (dataVersion to detect changes, files to precache).
 * @param {import('../../src/lib/types').CityConfig} city
 * @param {string[]} files paths relative to the city folder
 * @param {string} dataVersion
 * @returns {import('../../src/lib/types').CityManifest}
 */
export const toManifest = (city, files, dataVersion) => ({
	schemaVersion: SCHEMA_VERSION,
	dataVersion,
	...city,
	files: files.filter((file) => file !== MANIFEST_FILE)
});

/**
 * All files below dir (recursively, ignored files skipped) as paths relative to dir, sorted.
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function listFiles(dir, prefix = '') {
	/** @type {string[]} */
	const files = [];
	for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
		const path = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) files.push(...listFiles(dir, path));
		else if (notIgnored(entry.name)) files.push(path);
	}
	return files.sort();
}

/**
 * @param {string} dir
 * @param {string[]} files paths relative to dir
 */
export const totalSize = (dir, files) =>
	files.reduce((sum, file) => sum + statSync(join(dir, file)).size, 0);
