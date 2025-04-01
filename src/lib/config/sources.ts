// src/lib/config/sources.ts
import defiesData from '$lib/data/defibrillator.json';
import drinkingWaterData from '$lib/data/drinking-water.json';
import toiletsData from '$lib/data/toilets.json';
import waterPumpsData from '$lib/data/water-pumps.json';
import type { GeoJSON } from 'geojson';

export interface SourceConfig {
	id: string;
	type: 'raster' | 'geojson' | 'vector';
	tiles?: string[];
	tileSize?: number;
	attribution?: string;
	minzoom?: number;
	maxzoom?: number;
	data?: GeoJSON;
}

export const SOURCES_CONFIG: SourceConfig[] = [
	{
		id: 'drinkingWater',
		type: 'geojson',
		data: drinkingWaterData as unknown as GeoJSON
	},
	{
		id: 'toilets',
		type: 'geojson',
		data: toiletsData as unknown as GeoJSON
	},
	{
		id: 'waterPumps',
		type: 'geojson',
		data: waterPumpsData as unknown as GeoJSON
	},
	{
		id: 'defies',
		type: 'geojson',
		data: defiesData as unknown as GeoJSON
	}
];
