<script lang="ts">
	import type { TabItem } from '$lib/types'; // Adjust the import path as needed
	import { Tabs } from 'bits-ui';
	let { tabItems }: { tabItems: TabItem[] } = $props();
</script>

<Tabs.Root value={tabItems[0]?.title || ''} class="w-[343px]">
	<Tabs.List>
		{#each tabItems as tabItem}
			<Tabs.Trigger value={tabItem.title}>
				{#if tabItem.icon}
					<tabItem.icon class="mr-2" />
				{/if}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
	{#each tabItems as tabItem}
		<Tabs.Content value={tabItem.title}>
			<div>{tabItem.title}</div>
			{tabItem.content}</Tabs.Content
		>
	{/each}
</Tabs.Root>
