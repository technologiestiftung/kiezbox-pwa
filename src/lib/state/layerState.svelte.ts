import { LAYER_CONFIG } from '$lib/config/layers';
import { mapState } from './mapState.svelte';

function createLayerState() {
	const layerVisibility = $state<Record<string, string>>({});

	LAYER_CONFIG.forEach((layer) => {
		layerVisibility[layer.id] = layer.layout?.visibility ?? 'visible';
	});

	return {
		layerVisibility,
		toggleLayerVisibility(layerId: string) {
			if (!mapState.map) return;

			const currentVisibility = layerVisibility[layerId];

			const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';

			mapState.map.setLayoutProperty(layerId, 'visibility', newVisibility);

			layerVisibility[layerId] = newVisibility;
		},
		setLayerVisibility(layerId: string, visibility: 'visible' | 'none') {
			if (!mapState.map) return;

			mapState.map.setLayoutProperty(layerId, 'visibility', visibility);

			layerVisibility[layerId] = visibility;
		}
	};
}

export const layerState = createLayerState();
