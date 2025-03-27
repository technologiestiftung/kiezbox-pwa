<script lang="ts">
	let { isInCall } = $props();
	import { t } from '$lib/translations';
	import SpeechBubble from './SpeechBubble.svelte';
</script>

{#if !isInCall}
	<div class="">{@html $t('content.emergency_phone.default.offline.text')}</div>
	<ul class="space-y-2 px-4">
		{#each { length: 5 }, i}
			<li>
				{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}
			</li>
		{/each}
	</ul>
{:else}
	<div class="space-y-2 px-4">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
	<div class="flex flex-col items-center gap-10">
		{#each { length: 5 }, i}
			<SpeechBubble
				header={$t(`content.emergency_phone.default.questions.${i + 1}.text`)}
				children={$t(`content.emergency_phone.default.questions.${i + 1}.description`)}
			></SpeechBubble>
		{/each}
	</div>
{/if}
