<script lang="ts">
	import type { TabItem } from '$lib/types';
	import TabView from './TabView.svelte';
	import { t } from '$lib/translations';
	import {
		BaggageClaim,
		EventIncident,
		Fire,
		Flood,
		ThunderstormStrong
	} from 'carbon-icons-svelte';

	$: tabItems = [
		{
			title: $t('pm.personal_precautions.title'),
			icon: BaggageClaim,
			slug: '',
			content: []
		},
		{
			title: $t('pm.personal_precautions.title'),
			icon: Fire,
			slug: '',
			content: []
		},
		{
			title: $t('pm.personal_precautions.title'),
			icon: Flood,
			slug: '',
			content: []
		},
		{
			title: $t('pm.personal_precautions.title'),
			icon: ThunderstormStrong,
			slug: '',
			content: []
		},
		{
			title: $t('pm.personal_precautions.title'),
			icon: EventIncident,
			slug: '',
			content: []
		}
	];
</script>

<div>
	<TabView {tabItems}></TabView>
</div>
