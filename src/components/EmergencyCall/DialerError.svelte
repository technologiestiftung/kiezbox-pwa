<script lang="ts">
	import Copy from 'carbon-icons-svelte/lib/Copy.svelte';
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';

	let { errorMessage, onClick } = $props();

	let currentUrl = $state('');

	onMount(() => {
		// Ensure the URL is updated if the component is mounted after navigation
		// currentUrl = window.location.href;
		currentUrl = PUBLIC_API_URL;
	});

	const copyToClipboard = () => {
		navigator.clipboard.writeText(currentUrl);
	};
</script>

<div class={`Dialer-root bg-notruf-light relative grid max-w-[43.75rem] justify-center`}>
	<div class=" flex justify-center p-6 md:w-[29rem]">
		<div class="notruf-container flex flex-col items-start gap-2">
			<span class="body-large-bold text-error">
				{$t('content.emergency_phone.error.title')}
			</span>
			<span class="body-text text-error">
				{$t('content.emergency_phone.error.messages.' + errorMessage)}
			</span>
			<div class="flex items-center gap-4">
				<a
					href={currentUrl}
					target="_blank"
					class="text-body-black dark:text-body-black flex items-center hover:underline"
					onclick={(e) => {
						copyToClipboard();
					}}
				>
					{currentUrl}
				</a>
				<button
					class="text-body-black dark:text-body-black cursor-pointer hover:underline"
					onclick={(e) => {
						copyToClipboard();
					}}
				>
					<Copy />
				</button>
			</div>
			<button
				class="bg-notruf-rot hover:bg-notruf-rot mt-4 w-full cursor-pointer rounded px-4 py-2 text-white dark:text-white"
				onclick={onClick}
			>
				{$t('content.emergency_phone.error.button')}
			</button>
		</div>
	</div>
	<div class={`absolute -bottom-14 z-10 flex h-14 w-full justify-center`}></div>
</div>
