import type { Map as MapLibreMap, Popup } from 'maplibre-gl';

interface MapState {
	map: null | MapLibreMap;
	layers: string[];
	loaded: boolean;
	cardRef: HTMLElement | undefined;
	popup: Popup | null;
}

export const mapState = $state<MapState>({
	map: null,
	layers: [],
	loaded: false,
	cardRef: undefined,
	popup: null
});
