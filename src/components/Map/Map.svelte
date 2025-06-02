<script lang="ts">
	import { LAYER_STYLE } from '$lib/config/layer-style-positron';
	import { LAYER_CONFIG } from '$lib/config/layers';
	import { SOURCES_CONFIG } from '$lib/config/sources';
	import { mapState, poiState } from '$lib/state/state.svelte';
	import type { GeoJSON } from 'geojson';
	import maplibregl, { type AddLayerObject, type LngLatLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import Legend from './Legend.svelte';
	import PopupCard from './PopupCard.svelte';
	import { apiFetch } from '$lib/api';
	import { NetworkStore } from '$lib/state/networkState.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
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
					}
				},
				layers: LAYER_STYLE,
				glyphs: '/fonts/{fontstack}/{range}.pbf?key={key}'
			},
			center: NetworkStore.coordinates ?? [13.411833, 52.500398],
			zoom: 14,
			attributionControl: false,
			maxBounds: [13.091992716067702, 52.33488609760638, 13.742786470433, 52.67626223889507]
		});

		const LAYER_IDS = LAYER_CONFIG.map((layer) => layer.id);

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

			if (LAYER_IDS.length > 0) {
				map.on('mouseenter', LAYER_IDS, () => {
					map.getCanvas().style.cursor = 'pointer';
				});

				map.on('mouseleave', LAYER_IDS, () => {
					map.getCanvas().style.cursor = '';
				});
			}
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

		map.on(
			'click',
			LAYER_IDS,
			(e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
				if (!e.features || e.features.length === 0) return;

				const feature = e.features[0];
				const coordinates =
					feature.geometry.type === 'Point'
						? (feature.geometry.coordinates as [number, number]).slice()
						: (e.lngLat.toArray() as [number, number]);

				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}

				poiState.layer = feature.layer;
				poiState.properties = feature.properties;

				mapState.popup = new maplibregl.Popup({
					className: 'kb-popup',
					closeButton: false,
					offset: 14.5
				})
					.setLngLat(coordinates as LngLatLike)
					.setDOMContent(mapState.cardRef as Node)
					.setMaxWidth('256px')
					.addTo(map);
			}
		);

		mapState.map = map;

		return () => {
			map.remove();
			if (mapState.popup) {
				mapState.popup.remove();
			}
		};
	});
</script>

<div class="Map-root relative h-full w-full" bind:this={mapContainer}>
	<PopupCard />
	<Legend />
</div>
