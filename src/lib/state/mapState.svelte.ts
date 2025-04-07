interface MapState {
	map: null | maplibregl.Map;
	layers: string[];
	loaded: boolean;
	cardRef: HTMLElement | undefined;
	popup: maplibregl.Popup | null;
}

export const mapState = $state<MapState>({
	map: null,
	layers: [],
	loaded: false,
	cardRef: undefined,
	popup: null,
});
