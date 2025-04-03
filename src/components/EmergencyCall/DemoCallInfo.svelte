<script lang="ts">
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';
	import SpeechBubble from './SpeechBubble.svelte';
	let { isInCall } = $props();

	const BUBBLE_COUNT = 5;
	const SCROLL_DURATION = 3500;
	const RESUME_DELAY = 5000;

	let scrollContainerElement: HTMLDivElement | undefined = $state();
	let bubbleElements: Array<HTMLDivElement | undefined> = $state(
		new Array(BUBBLE_COUNT).fill(undefined)
	);
	let bubbleVisibility: boolean[] = $state(new Array(BUBBLE_COUNT).fill(false));

	let currentBubbleIndex = $state(0);
	let visibilityObservers: IntersectionObserver[] = [];
	let startAnimationObserver: IntersectionObserver | null = null;
	let userInteracted = $state(false);
	let animationLoopId: number | null = null;
	let resumeTimerId: number | null = null;
	let animationHasStarted = $state(false);
	let isProgrammaticScroll = false;
	let programmaticScrollTimeout: number | null = null;

	onMount(() => {
		if (!scrollContainerElement) return;

		let initialSetupTimer: number | null = null;

		initialSetupTimer = setTimeout(() => {
			initialSetupTimer = null;
			setupVisibilityObservers();
			setupStartAnimationObserver();
		}, 200);

		return () => {
			visibilityObservers.forEach((observer) => observer.disconnect());
			startAnimationObserver?.disconnect();
			if (initialSetupTimer !== null) clearTimeout(initialSetupTimer);
			if (animationLoopId !== null) clearTimeout(animationLoopId);
			if (resumeTimerId !== null) clearTimeout(resumeTimerId);
			if (programmaticScrollTimeout !== null) clearTimeout(programmaticScrollTimeout);
		};
	});

	const setupVisibilityObservers = () => {
		if (!scrollContainerElement) return;
		visibilityObservers.forEach((obs) => obs.disconnect());
		visibilityObservers = [];

		bubbleElements.forEach((element, index) => {
			if (!element) return;
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						bubbleVisibility = bubbleVisibility.map((visible, i) =>
							i === index ? entry.isIntersecting : visible
						);
					});
				},
				{
					root: scrollContainerElement,
					threshold: 0.6,
					rootMargin: '-10% 0px -10% 0px'
				}
			);
			observer.observe(element);
			visibilityObservers.push(observer);
		});
	};

	const setupStartAnimationObserver = () => {
		if (!scrollContainerElement || !bubbleElements[0]) {
			return;
		}
		startAnimationObserver?.disconnect();
		startAnimationObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && !animationHasStarted && !userInteracted) {
					animationHasStarted = true;
					scrollToNextBubble();
					startAnimationObserver?.unobserve(bubbleElements[0]!);
				}
			},
			{
				root: scrollContainerElement,
				threshold: 0.1
			}
		);
		startAnimationObserver.observe(bubbleElements[0]);
	};

	const scrollToNextBubble = () => {
		if (!animationHasStarted || !scrollContainerElement) {
			return;
		}
		if (userInteracted) {
			return;
		}

		if (resumeTimerId !== null) {
			clearTimeout(resumeTimerId);
			resumeTimerId = null;
		}

		const indexToScroll = currentBubbleIndex % BUBBLE_COUNT;
		const element = bubbleElements[indexToScroll];

		if (element) {
			isProgrammaticScroll = true;
			if (programmaticScrollTimeout !== null) clearTimeout(programmaticScrollTimeout);
			programmaticScrollTimeout = setTimeout(() => {
				isProgrammaticScroll = false;
				programmaticScrollTimeout = null;
			}, 1000);
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });

			currentBubbleIndex = indexToScroll + 1;

			if (animationLoopId !== null) {
				clearTimeout(animationLoopId);
			}
			animationLoopId = setTimeout(() => {
				animationLoopId = null;
				scrollToNextBubble();
			}, SCROLL_DURATION);
		} else {
			if (animationLoopId !== null) {
				clearTimeout(animationLoopId);
				animationLoopId = null;
			}
			animationHasStarted = false;
		}
	};

	const handleScroll = (event: Event) => {
		if (isProgrammaticScroll) {
			return;
		}
		if (event.isTrusted) {
			if (animationLoopId !== null || resumeTimerId !== null) {
				userInteracted = true;
				if (animationLoopId !== null) {
					clearTimeout(animationLoopId);
					animationLoopId = null;
				}
				if (resumeTimerId !== null) {
					clearTimeout(resumeTimerId);
					resumeTimerId = null;
				}
				resumeTimerId = setTimeout(() => {
					resumeTimerId = null;
					userInteracted = false;
					scrollToNextBubble();
				}, RESUME_DELAY);
			}
			if (!animationHasStarted && startAnimationObserver && bubbleElements[0]) {
				startAnimationObserver.unobserve(bubbleElements[0]);
			}
		}
	};
</script>

{#if !isInCall}
	<div class="DemoCallInfo-root sticky top-0 z-10 w-full bg-white p-4">
		{@html $t('content.emergency_phone.default.offline.text')}
		<ul class="mt-8 w-full space-y-2 px-4">
			{#each { length: BUBBLE_COUNT } as _, i}
				<li>{@html $t(`content.emergency_phone.default.questions.${i + 1}.text`)}</li>
			{/each}
		</ul>
	</div>
{:else}
	<div class="DemoCallInfo-root sticky top-0 z-10 w-full bg-white p-4">
		<div class="">{$t('content.emergency_phone.default.online.text')}</div>
	</div>
	<div
		bind:this={scrollContainerElement}
		onscroll={handleScroll}
		onwheel={handleScroll}
		ontouchmove={handleScroll}
		class="flex h-[calc(100vh-250px)] w-full flex-1 flex-col items-center gap-10 overflow-y-auto scroll-smooth p-4 pb-32"
		aria-label="Scrolling question bubbles"
	>
		{#each { length: BUBBLE_COUNT } as _, i}
			<div
				bind:this={bubbleElements[i]}
				class="flex w-full justify-center"
				role="group"
				aria-label={`Question ${i + 1}`}
			>
				<SpeechBubble
					header={$t(`content.emergency_phone.default.questions.${i + 1}.text`)}
					children={$t(`content.emergency_phone.default.questions.${i + 1}.description`)}
					isVisible={bubbleVisibility[i]}
				/>
			</div>
		{/each}
	</div>
{/if}
