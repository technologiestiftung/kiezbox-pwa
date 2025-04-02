<script lang="ts">
	import { LAYER_STYLE } from '$lib/config/layer-style-positron';
	import { LAYER_CONFIG } from '$lib/config/layers';
	import { SOURCES_CONFIG } from '$lib/config/sources';
	import { mapState, poiState } from '$lib/state/state.svelte';
	import type { GeoJSON } from 'geojson';
	import maplibregl, { type AddLayerObject } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import DetailsCard from './DetailsCard.svelte';
	import Legend from './Legend.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
	let clickPoint = $state({ x: 0, y: 0 });

	let map: maplibregl.Map;

	onMount(() => {
		if (!mapContainer) return;
		const baseUrl = window.location.origin;

		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					openmaptiles: {
						type: 'vector',
						tiles: [`${baseUrl}/pbf-tiles/{z}/{x}/{y}.pbf`],
						attribution: '© OpenStreetMap contributors',
						maxzoom: 13
					},
				},
				layers: LAYER_STYLE,
				glyphs: '/fonts/{fontstack}/{range}.pbf?key={key}'
			},
			center: [13.404954, 52.520008],
			zoom: 10,
			attributionControl: false,
			maxBounds: [13.091992716067702, 52.33488609760638, 13.742786470433, 52.67626223889507]
		});

		map.on('load', async () => {
			const iconMappings = {
				'toilet-icon': '/icons/toilet.png',
				'water-pump-icon': '/icons/water-pump.png',
				'drinking-water-icon': '/icons/drinking-water.png',
				'defibrillator-icon': '/icons/defibrillator.png'
			};

			for (const [iconName, iconPath] of Object.entries(iconMappings)) {
				const iconImage = await map.loadImage(iconPath);
				if (iconImage) map.addImage(iconName, iconImage.data);
			}

			SOURCES_CONFIG.forEach((source) => {
				map.addSource(source.id, {
					type: source.type,
					data: source.data as unknown as GeoJSON
				});
			});

			LAYER_CONFIG.forEach((layer) => {
				map.addLayer({
					id: layer.id,
					type: layer.type,
					source: layer.source,
					layout: layer.layout
				} as AddLayerObject);
			});
		});

		// Add controls
		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true
			}),
			'bottom-right'
		);
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
		map.addControl(new maplibregl.FullscreenControl(), 'top-right');

		map.on('click', (e: maplibregl.MapMouseEvent) => {
			if (poiState.layer && poiState.properties) {
				poiState.layer = null;
				poiState.properties = null;
				return;
			}

			const features = map.queryRenderedFeatures(e.point);
			clickPoint = { x: e.point.x, y: e.point.y };

			if (features.length === 0) {
				poiState.layer = null;
				poiState.properties = null;
				return;
			}

			poiState.properties = features[0].properties;
			poiState.layer = features[0].layer;

			clickPoint = { x: e.point.x, y: e.point.y };
		});

		mapState.map = map;

		return () => {
			map.remove();
		};
	});
</script>

<div class="Map-root relative h-full w-full" bind:this={mapContainer}>
	{#if poiState.layer || poiState.properties}
		<DetailsCard {clickPoint} {mapContainer} />
	{/if}
	<Legend />
</div>
