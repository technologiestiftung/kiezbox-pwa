// Fails the build if build/ alone exceeds the size limit of the Kiezbox device (64 MB).
// The city data comes on top; package-city.js checks app + city together.
import { join } from 'node:path';
import { LIMIT_MB, MB, WARN_MB, listFiles, totalSize } from './lib/city.js';

const buildDir = join(import.meta.dirname, '..', 'build');
const files = listFiles(buildDir);
const total = totalSize(buildDir, files);

const format = (/** @type {number} */ bytes) => `${(bytes / MB).toFixed(1)} MB`;
console.log(`\nApp-Größe (build/): ${format(total)} (Limit ${LIMIT_MB} MB für App + Stadtdaten)`);

// Leftover from before the city data moved to /city/: static/pbf-tiles would end up in the build
if (files.some((file) => file.startsWith('pbf-tiles/'))) {
	console.warn(
		`\n⚠ build/pbf-tiles/ gefunden. Der alte Ordner static/pbf-tiles/ kann gelöscht werden.`
	);
}

if (total > LIMIT_MB * MB) {
	console.error(`\n✖ App ist größer als ${LIMIT_MB} MB.\n`);
	process.exit(1);
}
if (total > WARN_MB * MB) {
	console.warn(`\n⚠ App ist größer als ${WARN_MB} MB, nur noch wenig Puffer bis zum Limit.\n`);
}
