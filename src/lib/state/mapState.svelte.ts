interface MapState {
	map: null | maplibregl.Map;
	layers: string[];
	loaded: boolean;
}

export const mapState = $state<MapState>({
	map: null,
	layers: [],
	loaded: false
});
