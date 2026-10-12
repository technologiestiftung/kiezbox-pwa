// src/lib/config/city.ts
// The city data is not part of the app build: it is served under /city/ (on the Kiezbox by its
// webserver, locally by scripts/lib/vite-plugin-city.js) and loaded once at startup.
import type { CityManifest } from '$lib/types';

export const CITY_PATH = '/city';

/** Must match SCHEMA_VERSION in scripts/lib/city.js */
const SUPPORTED_SCHEMA_VERSION = 1;

let city: CityManifest | null = null;

/** Absolute URL of a file of the city data, e.g. cityUrl('poi/toilets.json') */
export const cityUrl = (path: string) => `${window.location.origin}${CITY_PATH}/${path}`;

export async function loadCity(): Promise<CityManifest> {
	const response = await fetch(`${CITY_PATH}/city.json`);
	if (!response.ok) {
		throw new Error(`Failed to load ${CITY_PATH}/city.json: ${response.status}`);
	}
	const manifest = (await response.json()) as CityManifest;
	if (manifest.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
		throw new Error(
			`City data has schemaVersion ${manifest.schemaVersion}, app supports ${SUPPORTED_SCHEMA_VERSION}`
		);
	}
	city = manifest;
	return manifest;
}

/** The loaded city. Only call after loadCity() resolved (the root layout waits for it). */
export function getCity(): CityManifest {
	if (!city) throw new Error('City data not loaded yet');
	return city;
}
