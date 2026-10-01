// Fails the build if build/ exceeds the size limit of the Kiezbox device (64 MB).
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const LIMIT_MB = 64;
const WARN_MB = 50;
const MB = 1024 * 1024;

const buildDir = join(import.meta.dirname, '..', 'build');

let total = 0;
const tilesPerZoom = new Map();

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(path);
			continue;
		}
		const size = statSync(path).size;
		total += size;

		const [first, zoom] = relative(buildDir, path).split(sep);
		if (first === 'pbf-tiles' && /^\d+$/.test(zoom)) {
			tilesPerZoom.set(Number(zoom), (tilesPerZoom.get(Number(zoom)) ?? 0) + size);
		}
	}
}

walk(buildDir);

const format = (bytes) => `${(bytes / MB).toFixed(1)} MB`;
const tilesTotal = [...tilesPerZoom.values()].reduce((sum, size) => sum + size, 0);

console.log(
	`\nBuild-Größe: ${format(total)} (Limit ${LIMIT_MB} MB), davon Tiles ${format(tilesTotal)}`
);
for (const [zoom, size] of [...tilesPerZoom].sort(([a], [b]) => a - b)) {
	console.log(`  z${zoom}: ${format(size)}`);
}

if (total > LIMIT_MB * MB) {
	console.error(
		`\n✖ Build ist größer als ${LIMIT_MB} MB. Tiles mit niedrigerem maxzoom neu erzeugen.\n`
	);
	process.exit(1);
}
if (total > WARN_MB * MB) {
	console.warn(`\n⚠ Build ist größer als ${WARN_MB} MB, nur noch wenig Puffer bis zum Limit.\n`);
}
