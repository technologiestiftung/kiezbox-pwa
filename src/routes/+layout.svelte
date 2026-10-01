<script lang="ts">
	import { loadCity } from '$lib/config/city';
	import { loadTranslations } from '$lib/translations';
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

	// The city data (map, POIs, texts, default language) is loaded from /city/ at runtime,
	// everything below reads it via getCity()
	const ready = loadCity().then((city) => loadTranslations(city.defaultLocale));
	ready.catch((error) => console.error(error));

	// detect service worker update
	async function detectSWUpdate() {
		const registration = await navigator.serviceWorker.ready;

		registration.addEventListener('updatefound', () => {
			const newSW = registration.installing;
			newSW?.addEventListener('statechange', () => {
				if (newSW.state === 'installed') {
					if (confirm('New version available. Reload?')) {
						newSW.postMessage({ type: 'SKIP_WAITING' });
						window.location.reload();
					}
				}
			});
		});
	}
	onMount(() => detectSWUpdate());
</script>

<div class="bg-grey-light h-full w-full">
	{#await ready then}
		{@render children?.()}
	{:catch}
		<!-- No translations without city data, so this message is fixed -->
		<p class="p-8 text-center">
			Die Stadtdaten konnten nicht geladen werden. Bitte die Seite neu laden.<br />
			City data could not be loaded. Please reload the page.
		</p>
	{/await}
</div>
