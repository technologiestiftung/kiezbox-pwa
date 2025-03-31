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

export const BASE_SOURCES_CONFIG: SourceConfig[] = [
	{
		id: 'osm',
		type: 'raster',
		tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
		tileSize: 256,
		attribution: '© OpenStreetMap contributors',
		maxzoom: 18
	},
	{
		id: 'osmLocal',
		type: 'raster',
		tiles: ['/tiles/{z}/{x}/{y}.png'],
		tileSize: 256,
		attribution: '© OpenStreetMap contributors',
		maxzoom: 15
	}
];

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
