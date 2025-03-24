<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { loadTranslations } from '$lib/translations';

	import type { LayoutLoad } from './$types';
	import { browser } from '$app/environment';

	export const load: LayoutLoad = async ({ url }) => {
		const { pathname } = url;
		const initLocale = 'de';

		await loadTranslations(initLocale, pathname);

		return { locale: initLocale, route: pathname };
	};

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

<slot />
