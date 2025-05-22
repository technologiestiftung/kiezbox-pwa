<script lang="ts">
	import { apiFetch } from '$lib/api';
	import { loadTranslations } from '$lib/translations';
	import type { Mode } from '$lib/utils/callUtils';
	import { onMount, setContext } from 'svelte';
	import '../app.css';
	import type { LayoutLoad } from './$types';

	let { children } = $props();
	let apiStatus = $state<State>('idle');
	let mode: Mode = $state({ status: 0, isEmergency: false });
	let SIPconfig: SIPConfig = $state({
		kbServerAddress: '',
		kbWSSPort: 0,
		kbWSSPath: '',
		kbDomain: '',
		kbUserPrefix: ''
	});
	setContext('SIPconfig', SIPconfig);
	setContext('mode', mode);

	let lastPingTime = $state<Date | null>(null);
	let error = $state(null);

	const PING_INTERVAL_MS = 10000; // 10 seconds
	const PING_API_ENDPOINT = '/mode';
	const SIP_API_ENDPOINT = '/sipconfig';

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
				/*
				 * Fetch the mode from the API.
				 * The API should return a JSON object with a "mode" property.
				 */
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const response = (await apiFetch(PING_API_ENDPOINT)) as any;
				const SIPConfig = (await apiFetch(SIP_API_ENDPOINT)) as any;

				lastPingTime = new Date();
				mode.status = response.mode;
				mode.isEmergency = response.mode === 2;

				SIPconfig.kbServerAddress = SIPConfig.kbServerAddress;
				SIPconfig.kbWSSPort = SIPConfig.kbWSSPort;
				SIPconfig.kbWSSPath = SIPConfig.kbWSSPath;
				SIPconfig.kbDomain = SIPConfig.kbDomain;
				SIPconfig.kbUserPrefix = SIPConfig.kbUserPrefix;
			} catch (error: unknown) {
				apiStatus = 'error';
				if (error instanceof Error) {
					console.error('Error fetching mode:', error);
				} else {
					console.error('Error fetching mode:', error);
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
