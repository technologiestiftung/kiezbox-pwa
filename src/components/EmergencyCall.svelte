<script lang="ts">
	let { activateCall, isCall } = $props();
	import { t } from '$lib/translations';
	import CallerScreen from './CallerScreen.svelte';

	let buttonText = isCall
		? $t('content.emergency_phone.emergency.offline.call_button')
		: $t('content.emergency_phone.emergency.online.call_button');
</script>

<div class="demoCall-root mp-8 flex h-full flex-grow flex-col justify-between space-y-8 py-6">
	{#if !isCall}
		<div class="">{$t('content.emergency_phone.emergency.offline.text')}</div>
		<div class="">{$t('content.emergency_phone.default.questions.title')}</div>
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
	{:else}
		<div class="space-y-2 px-4">
			<div class="">{$t('content.emergency_phone.default.online.text')}</div>
		</div>
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
	{/if}
	<CallerScreen {isCall} {activateCall} {buttonText} />
</div>
