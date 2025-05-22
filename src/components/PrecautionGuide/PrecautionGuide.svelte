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
	import { t, loading } from '$lib/translations';
	import type { TabItem } from '$lib/types'; // Import your type if needed

	// Utility function to dynamically assign icons and hrefs (keep as is)
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

	const precautionSlugs = ['personal_precautions', 'fire', 'flood', 'storm', 'cbrn'];

	let tabItems: (TabItem & { icon: typeof BaggageClaim | null })[] = []; // Initialize as empty array

	$: {
		if (!$loading && $t) {
			tabItems = createPrecautionTabItems($t, precautionSlugs).map((item) => ({
				...item,
				icon: getIcon(item.slug) // Add the icon reactively
			}));
		} else {
			tabItems = [];
		}
	}
</script>

<div class="PrecautionGuide-root bg-purple-light flex w-full flex-col">
	<div class="flex min-h-14 items-center justify-center">
		{#if !$loading}
			<h2 class="text-purple-dark">{$t('content.precaution_infos.title')}</h2>
		{/if}
	</div>

	{#if tabItems.length > 0}
		<TabView {tabItems}></TabView>
	{/if}
</div>
