<!-- Map.svelte -->
<script lang="ts">
	import defiesData from '$lib/data/defibrillator.json';
	import drinkingWaterData from '$lib/data/drinking-water.json';
	import toiletsData from '$lib/data/toilets.json';
	import waterPumpsData from '$lib/data/water-pumps.json';
	import { mapState, poiState } from '$lib/state/state.svelte';
	import { selectedPOI } from '$lib/stores/poiStore';
	import type { GeoJSON } from 'geojson';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import DetailsCard from './DetailsCard.svelte';
	import Legend from './Legend.svelte';

	const { width = '100%', height = '536px' } = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let clickPoint = $state({ x: 0, y: 0 });

	let map: maplibregl.Map;

	onMount(() => {
		if (!mapContainer) return;

		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					osm: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors'
					}
				},
				layers: [
					{
						id: 'osm-layer',
						type: 'raster',
						source: 'osm',
						layout: {
							visibility: 'visible'
						},
						paint: {
							'raster-saturation': -1,
							'raster-contrast': 0.2,
							'raster-opacity': 1
						}
					}
				]
			},
			center: [13.404954, 52.520008],
			zoom: 12,
			attributionControl: false,
			maxBounds: [13.091992716067702, 52.33488609760638, 13.742786470433, 52.67626223889507]
		});

		map.on('load', async () => {
			// Load and add images
			const toiletImg = await map.loadImage('/icons/toilet.png');
			const waterPumpImg = await map.loadImage('/icons/water-pump.png');
			const drinkingWaterImg = await map.loadImage('/icons/drinking-water.png');
			const defiesImg = await map.loadImage('/icons/defibrillator.png');

			if (toiletImg) map.addImage('toilet-icon', toiletImg.data);
			if (waterPumpImg) map.addImage('water-pump-icon', waterPumpImg.data);
			if (drinkingWaterImg) map.addImage('drinking-water-icon', drinkingWaterImg.data);
			if (defiesImg) map.addImage('defibrillator-icon', defiesImg.data);

			// Add sources
			map.addSource('drinkingWater', {
				type: 'geojson',
				data: drinkingWaterData as unknown as GeoJSON
			});
			map.addSource('toilets', {
				type: 'geojson',
				data: toiletsData as unknown as GeoJSON
			});
			map.addSource('waterPumps', {
				type: 'geojson',
				data: waterPumpsData as unknown as GeoJSON
			});
			map.addSource('defies', {
				type: 'geojson',
				data: defiesData as unknown as GeoJSON
			});

			// Add layers using the loaded icons
			map.addLayer({
				id: 'drink-water-layer',
				type: 'symbol',
				source: 'drinkingWater',
				layout: {
					'icon-image': 'drinking-water-icon',
					'icon-size': 1
				}
			});

			map.addLayer({
				id: 'toilets-layer',
				type: 'symbol',
				source: 'toilets',
				layout: {
					'icon-image': 'toilet-icon',
					'icon-size': 1
				}
			});

			map.addLayer({
				id: 'water-pumps-layer',
				type: 'symbol',
				source: 'waterPumps',
				layout: {
					'icon-image': 'water-pump-icon',
					'icon-size': 1
				}
			});

			map.addLayer({
				id: 'defies-layer',
				type: 'symbol',
				source: 'defies',
				layout: {
					'icon-image': 'defibrillator-icon',
					'icon-size': 1
				}
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

		map.on('click', (e) => {
			const features = map.queryRenderedFeatures(e.point);
			clickPoint = { x: e.point.x, y: e.point.y };

			if (features.length === 0) {
				selectedPOI.set(null);
				return;
			}
			selectedPOI.set({
				properties: features[0].properties,
				layer: features[0].layer
			});

			clickPoint = { x: e.point.x, y: e.point.y };
		});

		mapState.map = map;

		return () => {
			map.remove();
		};
	});
</script>

<div class="Map-root relative" bind:this={mapContainer} style="width: {width}; height: {height};">
	{#if $selectedPOI}
		<DetailsCard {clickPoint} {mapContainer} />
	{/if}

	<Legend />
</div>
