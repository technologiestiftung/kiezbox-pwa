<script lang="ts">
	import TabView from './TabView.svelte';
	import {
		BaggageClaim,
		Fire,
		Flood,
		ThunderstormStrong,
		EventIncident
	} from 'carbon-icons-svelte';
	import { createPrecautionTabItems } from '$lib/utils/precautionUtils';
	import { t, loading, locale, locales } from '$lib/translations';
	import type { TabItem } from '$lib/types'; // Import your type if needed
	import { NetworkStore, setAdminMode } from '$lib/state/networkState.svelte';

	function getIcon(slug: string) {
		const icons = {
			personal_precautions: BaggageClaim,
			fire: Fire,
			flood: Flood,
			storm: ThunderstormStrong,
			cbrn: EventIncident
		};
		return icons[slug as keyof typeof icons] || null;
	}

	let clickCount = $state(0);
	let clickTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	const REQUIRED_CLICKS = 7;
	const TIMEOUT_MS = 10000;

	const handleTitleClick = () => {
		clickCount++;

		if (clickCount === 1) {
			clickTimer = setTimeout(() => {
				clickCount = 0;
				clickTimer = null;
			}, TIMEOUT_MS);
		}

		if (clickCount >= REQUIRED_CLICKS) {
			if (clickTimer) {
				clearTimeout(clickTimer);
				clickTimer = null;
			}
			NetworkStore.adminMode = true;
			clickCount = 0;
		} else {
		}
	};

	$effect(() => {
		return () => {
			if (clickTimer) {
				clearTimeout(clickTimer);
			}
		};
	});

	const noOfClicks = $state(0);
	const precautionSlugs = ['personal_precautions', 'fire', 'flood', 'storm', 'cbrn'];

	let tabItems = $state<(TabItem & { icon: typeof BaggageClaim | null })[]>([]); // Initialize as reactive state

	$effect(() => {
		if (!$loading && $t) {
			tabItems = createPrecautionTabItems($t, precautionSlugs).map((item) => ({
				...item,
				icon: getIcon(item.slug) // Add the icon reactively
			}));
		} else {
			tabItems = [];
		}
	});
</script>

<div class="PrecautionGuide-root bg-purple-light relative flex w-full flex-col">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore event_directive_deprecated -->
	<div class="flex min-h-14 items-center justify-center" on:click={handleTitleClick}>
		{#if !$loading}
			<h2
				class="text-purple-dark select-none
"
			>
				{$t('content.precaution_infos.title')}
			</h2>
		{/if}
	</div>
	<div
		class="text-purple-dark absolute top-0 right-0 z-99 flex cursor-pointer items-center justify-end p-4"
	>
		{#if !$loading}
			<select bind:value={$locale} class=" bg-purple-light cursor-pointer px-1">
				{#each $locales as value}
					<option {value}>{$t(`common.languages.${value}`)}</option>
				{/each}
			</select>
		{/if}
	</div>

	{#if tabItems.length > 0}
		<TabView {tabItems}></TabView>
	{/if}
</div>
