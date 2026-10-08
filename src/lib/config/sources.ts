// src/lib/config/sources.ts
export interface SourceConfig {
	id: string;
	type: 'geojson';
	/** GeoJSON file of the city data, relative to /city/ (see cityUrl) */
	data: string;
}

export const SOURCES_CONFIG: SourceConfig[] = [
	{
		id: 'drinkingWater',
		type: 'geojson',
		data: 'poi/drinking-water.json'
	},
	{
		id: 'toilets',
		type: 'geojson',
		data: 'poi/toilets.json'
	},
	{
		id: 'waterPumps',
		type: 'geojson',
		data: 'poi/water-pumps.json'
	},
	{
		id: 'defies',
		type: 'geojson',
		data: 'poi/defibrillator.json'
	}
];
