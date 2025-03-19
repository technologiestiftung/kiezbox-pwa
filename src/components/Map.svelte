<!-- Map.svelte -->
<script lang="ts">
	import { MAPSTORE_CONTEXT_KEY, type MapStore } from '$lib/stores/mapStore';
	import type { GeoJSON } from 'geojson';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import trinkwasserData from '$lib/data/trinkwasser.json';
	import { getContext } from 'svelte';

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
			zoom: 6,
			attributionControl: false,
			maxBounds: [13.091992716067702, 52.33488609760638, 13.742786470433, 52.67626223889507]
		});

		map.on('load', () => {
			// Add Trinkwasser (drinking water)
			map.addSource('trinkwasser', {
				type: 'geojson',
				data: trinkwasserData as GeoJSON
			});
			map.addLayer({
				id: 'trinkwasser-layer',
				type: 'circle',
				source: 'trinkwasser',
				paint: {
					'circle-radius': 5,
					'circle-color': '#3388ff',
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			// Add popup on click
			map.on('click', (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['trinkwasser-layer']
				});

				if (!features.length) return;

				const feature = features[0];

				new maplibregl.Popup()
					.setLngLat(e.lngLat)
					.setHTML(
						`<h3>${feature.layer.id.split('-')[0]}</h3>
                    <p>${feature.properties.name || 'No name'}</p>`
					)
					.addTo(map);
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
