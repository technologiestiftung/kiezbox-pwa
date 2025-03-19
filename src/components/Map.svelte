<!-- Map.svelte -->
<script lang="ts">
	import drinkingWaterData from '$lib/data/drinking-water.json';
	import toiletsData from '$lib/data/toilets.json';
	import waterPumpsData from '$lib/data/water-pumps.json';
	import { MAPSTORE_CONTEXT_KEY, type MapStore } from '$lib/stores/mapStore';
	import type { GeoJSON } from 'geojson';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { getContext, onMount } from 'svelte';

	const { width = '100%', height = '500px' } = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: maplibregl.Map;

	let mapStore: MapStore = getContext(MAPSTORE_CONTEXT_KEY);

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
						minzoom: 0,
						maxzoom: 19,
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

			if (toiletImg) map.addImage('toilet-icon', toiletImg.data);
			if (waterPumpImg) map.addImage('water-pump-icon', waterPumpImg.data);
			if (drinkingWaterImg) map.addImage('drinking-water-icon', drinkingWaterImg.data);

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
		});

		// Add controls
		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true
			}),
			'bottom-right'
		);

		map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
		map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

		mapStore?.set(map);

		return () => {
			map.remove();
		};
	});
</script>

<div bind:this={mapContainer} style="width: {width}; height: {height};"></div>

<style>
	div {
		position: relative;
	}
</style>
