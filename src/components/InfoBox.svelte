<script lang="ts">
	let {
		title,
		textBodyOrList,
		links
	}: {
		title: string;
		textBodyOrList: string | string[];
		links: {
			href: string;
			target?: string;
			text: string;
		}[];
	} = $props();
</script>

<div class="infoBox-root w-[329px] flex-col justify-center space-y-2 self-stretch pt-[1.313rem]">
	<h4 class="infoBox-title">{title}</h4>
	{#if Array.isArray(textBodyOrList)}
		<ul class="body-text">
			{#each textBodyOrList as item}
				<li>{item}</li>
			{/each}
		</ul>
	{:else}
		<p class="infoBox-body body-text">{textBodyOrList}</p>
	{/if}
	{#each links as link}
		<a
			class="infoBox-link body-text text-purple-dark after:content-['_↗']"
			href={link.href}
			target={link.target || '_self'}>{link.text}</a
		>
	{/each}
</div>

<style>
</style>
