// Fetches the POIs of the Stadt Solingen from its OGC API (GeoServer) into cities/solingen/poi/,
// so the app ships them with the city data instead of calling the API.
// Usage (to refresh the data): node scripts/fetch-solingen-poi.js
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API =
	'https://gdi-ows1.solingen.de/geoserver/poi/ogc/features/v1/collections/bp_alle_poi/items';

/** POI name (see "pois" in city.config.json) → CQL filter on wfslayername */
const FILTERS = {
	toilets: "wfslayername like '%Toilette%'",
	police: "wfslayername='Polizei'",
	'fire-station': "wfslayername like '%Feuer%'",
	hospital: "wfslayername='Krankenhaus'",
	defibrillator: "wfslayername='Defibrilator-Standort'"
};

const outDir = join(import.meta.dirname, '../cities/solingen/poi');

/**
 * The API has no address fields, only an HTML popup:
 * <b>Name</b><br><br>Street<br>42651 Solingen<br>Stadtbezirk …<br><br>Info: keine<br><br><a …>
 * @param {string} html
 */
function parsePopup(html) {
	const lines = html.split('<br>').map((line) => line.replace(/<[^>]*>/g, '').trim());
	const postcode = lines.findIndex((line) => /^\d{5} /.test(line));
	// Some entries have coordinates instead of a street
	const street =
		postcode > 0 && !/^[\d.,\s]+$/.test(lines[postcode - 1]) ? lines[postcode - 1] : '';
	const info = lines
		.find((line) => line.startsWith('Info:'))
		?.replace('Info:', '')
		.trim();
	return {
		address: [street, lines[postcode] ?? ''].filter(Boolean).join(', '),
		...(info && info !== 'keine' && { info })
	};
}

for (const [poi, filter] of Object.entries(FILTERS)) {
	const url = `${API}?f=application/json&limit=100&filter=${encodeURIComponent(filter)}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${poi}: ${response.status} ${response.statusText}`);
	const { features } = await response.json();
	if (!features?.length) throw new Error(`${poi}: keine POIs gefunden`);

	const collection = {
		type: 'FeatureCollection',
		source: `Stadt Solingen, ${API}, ${new Date().toISOString().slice(0, 10)}`,
		features: features.map((/** @type {any} */ feature) => ({
			type: 'Feature',
			id: feature.id,
			properties: {
				name: feature.properties.objektname.trim(),
				...parsePopup(feature.properties.popup_content)
			},
			geometry: { type: 'Point', coordinates: feature.geometry.coordinates.slice(0, 2) }
		}))
	};
	writeFileSync(join(outDir, `${poi}.json`), JSON.stringify(collection, null, '\t') + '\n');
	console.log(`${poi}: ${features.length}`);
}
