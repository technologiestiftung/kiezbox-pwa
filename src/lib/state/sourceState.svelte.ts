import type { GeoJSON } from 'geojson';

interface BaseMap {
	id: string;
	type: 'raster' | 'geojson';
	tiles?: string[];
	tileSize?: number;
	attribution?: string;
	minzoom?: number;
	maxzoom?: number;
	data?: GeoJSON;
}

function createSourceState() {
	const baseMap = $state<BaseMap | undefined>(undefined);

	return {
		baseMap
	};
}

export const sourceState = createSourceState();
