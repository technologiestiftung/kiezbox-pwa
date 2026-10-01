// Copies the city selected via PUBLIC_CITY from cities/<slug>/ into the places the app reads from:
//   cities/<slug>/tiles   -> static/pbf-tiles/
//   cities/<slug>/poi     -> src/lib/generated/poi/
//   cities/<slug>/locales -> src/lib/generated/locales/
//   city.config.json + tiles/metadata.json -> src/lib/generated/city.json
// All targets are gitignored build artefacts.
import 'dotenv/config';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CityError, notIgnored, readCity } from './lib/city.js';

const root = join(import.meta.dirname, '..');
const slug = process.env.PUBLIC_CITY;

/** @param {string} message */
function fail(message) {
	console.error(`\n✖ prepare-city: ${message}\n`);
	process.exit(1);
}

if (!slug) {
	fail('PUBLIC_CITY ist nicht gesetzt (z. B. PUBLIC_CITY=solingen in .env oder .env.<stadt>).');
}

const cityDir = join(root, 'cities', slug);
let city;
try {
	city = readCity(cityDir, slug);
} catch (error) {
	if (error instanceof CityError) fail(error.message);
	throw error;
}

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
