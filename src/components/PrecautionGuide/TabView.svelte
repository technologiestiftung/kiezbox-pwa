<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import type { TabItem } from '$lib/types'; // Adjust the import path as needed
	import InfoBox from './InfoBox.svelte';
	let { tabItems }: { tabItems: TabItem[] } = $props();
</script>

<Tabs.Root value={tabItems[0]?.slug || ''} class="w-full justify-center bg-white">
	<Tabs.List>
		{#each tabItems as tabItem}
			<Tabs.Trigger value={tabItem.slug} class="size-12">
				{#if tabItem.icon}
					<tabItem.icon class="size-8" />
				{/if}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
	{#each tabItems as tabItem}
		<Tabs.Content value={tabItem.slug}>
			<div class="flex flex-col px-6 pb-10 md:w-[29rem]">
				<h3 class="border-purple-mid border-b py-5">{tabItem.title}</h3>
				<div class="mt-10 space-y-10">
					{#each tabItem.content as infoBoxItem}
						<InfoBox {infoBoxItem} />
					{/each}
				</div>
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>
