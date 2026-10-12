<script lang="ts">
	import { cityUrl, getCity } from '$lib/config/city';
	import { LAYER_STYLE } from '$lib/config/layer-style-positron';
	import { LAYER_STYLE_TERRAIN } from '$lib/config/layer-style-terrain';
	import { poiLayers } from '$lib/config/poi';
	import { NetworkStore } from '$lib/state/networkState.svelte';
	import { mapState, poiState } from '$lib/state/state.svelte';
	import * as maplibregl from 'maplibre-gl';
	import type { AddLayerObject, LngLatLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	// maplibre-gl v6 resolves its worker relative to its own module URL, which
	// Vite neither pre-bundles nor emits — so let Vite bundle the worker itself
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import { onMount } from 'svelte';
	import Legend from './Legend.svelte';
	import PopupCard from './PopupCard.svelte';

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: maplibregl.Map;

	let coordinatesSet = $state(false);

	const BASE_STYLES = { positron: LAYER_STYLE, terrain: LAYER_STYLE_TERRAIN };

	$effect(() => {
		if (map && !coordinatesSet && NetworkStore.coordinates) {
			coordinatesSet = true;
			map.setCenter(NetworkStore.coordinates as LngLatLike);
		}
	});
	onMount(() => {
		if (!mapContainer) return;
		const city = getCity();

		maplibregl.setWorkerUrl(maplibreWorkerUrl);

		// Matches the extent of the city's tiles (cities/<slug>/tiles/metadata.json "bounds")
		const dataBounds = city.bounds;

		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					openmaptiles: {
						type: 'vector',
						tiles: [cityUrl('tiles/{z}/{x}/{y}.pbf')],
						attribution: '© OpenStreetMap contributors',
						maxzoom: city.maxzoom
					}
				},
				layers: BASE_STYLES[city.mapStyle ?? 'positron'],
				glyphs: '/fonts/{fontstack}/{range}.pbf?key={key}'
			},
			bounds: dataBounds,
			fitBoundsOptions: { padding: 20 },
			attributionControl: false,
			maxBounds: dataBounds,
			...(city.mapMaxZoom !== null && { maxZoom: city.mapMaxZoom })
		});

		const POI_LAYERS = poiLayers();
		/** px; the app's 96 px icons were shown at icon-size 0.3 */
		const ICON_WIDTH = 29;
		const LAYER_IDS = POI_LAYERS.map((layer) => layer.layerId);

		map.on('load', async () => {
			for (const layer of POI_LAYERS) {
				const { data: icon } = await map.loadImage(layer.mapIcon);
				map.addImage(layer.poi, icon);

				map.addSource(layer.poi, { type: 'geojson', data: cityUrl(layer.data) });
				map.addLayer({
					id: layer.layerId,
					type: 'symbol',
					source: layer.poi,
					layout: {
						visibility: 'visible',
						'icon-image': layer.poi,
						// Same width for every icon, whatever size the city's PNGs have
						'icon-size': ICON_WIDTH / icon.width,
						// ponytail: taller than wide = map pin pointing down; add a per-city setting if a
						// city ever ships tall icons that aren't pins
						'icon-anchor': icon.height > icon.width ? 'bottom' : 'center'
					}
				} as AddLayerObject);
			}

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
