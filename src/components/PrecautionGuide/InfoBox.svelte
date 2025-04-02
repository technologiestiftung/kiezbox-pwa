<script lang="ts">
	import type { InfoBoxItem } from '$lib/types';

	let { infoBoxItem }: { infoBoxItem: InfoBoxItem } = $props();
</script>

<div class="InfoBox-root flex-col justify-center space-y-2 self-stretch">
	<h4 class="InfoBoxItem-title">{infoBoxItem.title}</h4>
	{#if Array.isArray(infoBoxItem.textBodyOrList)}
		<ul class="body-text">
			{#each infoBoxItem.textBodyOrList as item}
				<li class="ml-4 list-disc">{item}</li>
			{/each}
		</ul>
	{:else}
		<p class="InfoBoxItem-body body-text">{infoBoxItem.textBodyOrList}</p>
	{/if}
	<div class="flex flex-col">
		{#each infoBoxItem.links as link}
			<a
				class="InfoBoxItem-link body-text text-purple-dark after:content-['_↗']"
				href={link.href}
				target={link.target || '_blank'}>{link.text}</a
			>
		{/each}
	</div>
</div>

<style>
</style>
