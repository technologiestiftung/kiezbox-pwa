<script lang="ts">
	let { isInCall } = $props();
	import { t } from '$lib/translations';
</script>

{#if !isInCall}
	<div class="EmergencyCallInfo-root sticky top-0 z-10 w-full bg-white p-4">
		<div class="">{$t('content.emergency_phone.emergency.offline.text')}</div>
		<div class="">{$t('content.emergency_phone.default.questions.title')}</div>
	</div>
	<div
		class="flex max-h-[calc(100vh-30rem)] w-full flex-1 flex-col items-center scroll-smooth p-4 pb-32"
	>
		<ul class="w-full space-y-2 px-4">
			{#each { length: 5 }, i}
				<li>
					{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<div class="EmergencyCallInfo-root sticky top-0 z-10 w-full bg-white p-4">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
	<div
		class="flex max-h-[calc(100vh-30rem)] w-full flex-1 flex-col items-center scroll-smooth p-4 pb-32"
	>
		<ul class="w-full space-y-2 px-4">
			{#each { length: 5 }, i}
				<li>
					{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}
				</li>
			{/each}
		</ul>
	</div>
{/if}
