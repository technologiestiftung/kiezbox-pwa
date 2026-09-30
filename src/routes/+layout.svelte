<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

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
