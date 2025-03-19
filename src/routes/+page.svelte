<script>
	import { createMapStore, MAPSTORE_CONTEXT_KEY } from '$lib/stores';
	import { setContext } from 'svelte';
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import Map from '../components/Map.svelte';

	const mapStore = createMapStore();
	setContext(MAPSTORE_CONTEXT_KEY, mapStore);
</script>

<div class="page-root">
	<h1>Kiezbox Test EmergencyCall</h1>
	<EmergencyCall />
	<Map />
</div>

<style>
	.page-root {
		max-width: 600px;
		max-height: 100vh;
		margin: 0 auto;
		padding: 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
</style>
