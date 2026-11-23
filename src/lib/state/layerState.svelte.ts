import { mapState } from './mapState.svelte';

function createLayerState() {
	// Only layers the user toggled; all POI layers start visible
	const layerVisibility = $state<Record<string, 'visible' | 'none'>>({});

	const isVisible = (layerId: string) => (layerVisibility[layerId] ?? 'visible') === 'visible';

	function setLayerVisibility(layerId: string, visibility: 'visible' | 'none') {
		if (!mapState.map) return;

		mapState.map.setLayoutProperty(layerId, 'visibility', visibility);

		layerVisibility[layerId] = visibility;
	}

	return {
		isVisible,
		setLayerVisibility,
		toggleLayerVisibility(layerId: string) {
			setLayerVisibility(layerId, isVisible(layerId) ? 'none' : 'visible');
		}
	};
}

export const layerState = createLayerState();
