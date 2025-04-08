<script lang="ts">
	import { apiFetch } from '$lib/api';
	import { loadTranslations } from '$lib/translations';
	import type { Mode } from '$lib/utils/callUtils';
	import { onMount, setContext } from 'svelte';
	import '../app.css';
	import type { LayoutLoad } from './$types';

	type State = 'idle' | 'pending' | 'success' | 'error';
	let { children } = $props();
	let apiStatus = $state<State>('idle');
	let mode: Mode = $state({ status: 0, isEmergency: false });
	setContext('mode', mode);
	let lastPingTime = $state<Date | null>(null);
	let error = $state(null);

	const PING_INTERVAL_MS = 10000; // 10 seconds
	const PING_API_ENDPOINT = '/mode';

	export const load: LayoutLoad = async ({ url }) => {
		const { pathname } = url;
		const initLocale = 'de';

		await loadTranslations(initLocale, pathname);

		return { locale: initLocale, route: pathname };
	};

	$effect(() => {
		const pingApi = async () => {
			apiStatus = 'pending';
			error = null;
			try {
				const response = await apiFetch(PING_API_ENDPOINT);

				lastPingTime = new Date();
				// TODO: Set emergency status based on the response
				mode.status = response.mode;
				mode.isEmergency = response.mode === 2;
			} catch (error: unknown) {
				apiStatus = 'error';
				if (error instanceof Error) {
					error = error.message;
				} else {
					error = 'Unknown error occurred';
				}
			}
		};

		pingApi();
		const intervalId = setInterval(pingApi, PING_INTERVAL_MS);
		return () => {
			clearInterval(intervalId);
		};
	});

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
	{@render children?.()}
</div>
