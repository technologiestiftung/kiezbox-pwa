<script lang="ts">
	import { t } from '$lib/translations';
	import SpeechBubble from './SpeechBubble.svelte';
	let { isInCall } = $props(); // Default value if needed

	const BUBBLE_COUNT = 5;
	let scrollContainerElement: HTMLDivElement | undefined = $state(); // Reference to the scrollable container
	let bubbleElements: Array<HTMLDivElement | undefined> = $state(
		new Array(BUBBLE_COUNT).fill(undefined)
	);
</script>

{#if !isInCall}
	<div class="p-4">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html $t('content.emergency_phone.default.offline.text')}
		<ul class="mt-2 list-disc space-y-1 pl-5">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each { length: BUBBLE_COUNT } as _, i}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<li>{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}</li>
			{/each}
		</ul>
	</div>
{:else}
	<div class="space-y-2 px-4 pt-4 pb-2">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
	<div
		bind:this={scrollContainerElement}
		class="flex h-[calc(60vh-10rem)] w-full flex-col items-center gap-10 overflow-y-auto scroll-smooth p-4"
		role="region"
		aria-live="polite"
	>
		<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
		{#each { length: BUBBLE_COUNT } as _, i}
			<div bind:this={bubbleElements[i]} class="flex w-full justify-center">
				<div class="w-full max-w-lg">
					<SpeechBubble
						header={$t(`content.emergency_phone.default.questions.${i + 1}.text`)}
						children={$t(`content.emergency_phone.default.questions.${i + 1}.description`)}
					/>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
</style>
