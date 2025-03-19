import type { Map as MaplibreMap } from 'maplibre-gl';
import { writable } from 'svelte/store';

export const MAPSTORE_CONTEXT_KEY = 'maplibre-map-store';

export type MapStore = ReturnType<typeof createMapStore>;

export const createMapStore = () => {
	const { set, update, subscribe } = writable<MaplibreMap>(undefined);

	return {
		subscribe,
		update,
		set
	};
};