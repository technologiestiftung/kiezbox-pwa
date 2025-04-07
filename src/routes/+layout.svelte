<script lang="ts">
	import { apiFetch } from '$lib/api';
	import { loadTranslations } from '$lib/translations';
	import { onMount, setContext } from 'svelte';
	import '../app.css';
	import type { LayoutLoad } from './$types';

	type State = 'idle' | 'pending' | 'success' | 'error';
	let apiStatus = $state<State>('idle');
	let emergencyStatus = $state(false);
	let lastPingTime = $state<Date | null>(null);
	let error = $state(null);

	const PING_INTERVAL_MS = 10000; // 10 seconds
	const PING_API_ENDPOINT = '/ping';

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

				if (!response.ok) {
					throw new Error(`API ping failed: ${response.status} ${response.statusText}`);
				}

				apiStatus = 'success';
				lastPingTime = new Date();
				// TODO: Set emergency status based on the response
				emergencyStatus = response.status === 200;
				setContext('emergency_status', emergencyStatus);
				console.log('API ping successful at', lastPingTime);
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
	<slot />
</div>
