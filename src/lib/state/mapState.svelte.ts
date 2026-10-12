import type { Map as MaplibreMap, Popup } from 'maplibre-gl';

interface MapState {
	map: null | MaplibreMap;
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
