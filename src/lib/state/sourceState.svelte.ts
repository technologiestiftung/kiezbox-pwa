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

interface SourceState {
	baseMap: BaseMap | undefined;
}

export const sourceState = $state<SourceState>({
	baseMap: undefined
});
