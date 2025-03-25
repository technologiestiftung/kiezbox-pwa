<script lang="ts">
	let { isCall } = $props();
	import { t } from '$lib/translations';
</script>

{#if !isCall}
	<div class="">{$t('content.emergency_phone.emergency.offline.text')}</div>
	<div class="">{$t('content.emergency_phone.default.questions.title')}</div>
{:else}
	<div class="space-y-2 px-4">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
{/if}
<ul class="space-y-2 px-4">
	<li>
		{$t('content.emergency_phone.default.questions.1.text')}
	</li>
	<li>
		{$t('content.emergency_phone.default.questions.2.text')}
	</li>
	<li>
		{$t('content.emergency_phone.default.questions.3.text')}
	</li>
	<li>
		{$t('content.emergency_phone.default.questions.4.text')}
	</li>
	<li>
		{$t('content.emergency_phone.default.questions.5.text')}
	</li>
</ul>
