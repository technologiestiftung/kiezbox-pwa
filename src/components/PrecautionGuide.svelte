<script lang="ts">
	import TabView from './PrecautionGuideComponents/TabView.svelte';
	import {
		BaggageClaim,
		Fire,
		Flood,
		ThunderstormStrong,
		EventIncident
	} from 'carbon-icons-svelte';
	import { createPrecautionTabItems } from '$lib/utils/precautionUtils';
	import { t } from '$lib/translations';

	// Utility function to dynamically assign icons and hrefs
	function getIcon(slug: string) {
		const icons = {
			personal_precautions: BaggageClaim,
			fire: Fire,
			flood: Flood,
			storm: ThunderstormStrong,
			cbrn: EventIncident
		};
		return icons[slug as keyof typeof icons];
	}

	// Define the precaution category slugs we want to display
	const precautionSlugs = ['personal_precautions', 'fire', 'flood', 'storm', 'cbrn'];

	// Create tab items dynamically from translations
	const tabItems = createPrecautionTabItems($t, precautionSlugs).map((item) => ({
		...item,
		icon: getIcon(item.slug)
	}));

	console.log(tabItems);
</script>

<div class="MainContent-root bg-purple-light flex w-full flex-col">
	<div class="flex min-h-14 items-center justify-center">
		<h2 class="text-purple-dark">{$t('content.precaution_infos.title')}</h2>
	</div>
	<TabView {tabItems}></TabView>
</div>
