<script lang="ts">
	let { isInCall } = $props();
	import { t } from '$lib/translations';
</script>

{#if !isInCall}
	<div class="">{$t('content.emergency_phone.emergency.offline.text')}</div>
	<div class="">{$t('content.emergency_phone.default.questions.title')}</div>
{:else}
	<div class="space-y-2 px-4">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
{/if}
<ul class="space-y-2 px-4">
	{#each { length: 5 }, i}
		<li>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}
		</li>
	{/each}
</ul>
