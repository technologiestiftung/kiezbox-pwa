<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { LAYER_CONFIG } from '$lib/config/layers';
	import { poiState } from '$lib/state/state.svelte';
	import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
	import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
	import CloseOutline from 'carbon-icons-svelte/lib/CloseOutline.svelte';
	import { onMount } from 'svelte';

	const { clickPoint = { x: 0, y: 0 }, mapContainer } = $props();

	let cardRef = $state<HTMLDivElement | null>(null);
	let cardPosition = $state({ top: clickPoint.y, left: clickPoint.x });
	let content = $state({});
	let title = $state('Details');
	let activeLayer = $state<(typeof LAYER_CONFIG)[number] | null>(null);
	let cardVisible = $state(false);
	let tipPosition = $state('top');

	let tipGeom = $state({ left: 0, top: 0 });

	onMount(() => {
		const handleResize = () => {
			updateCardPosition();
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	$effect(() => {
		activeLayer = LAYER_CONFIG.find((layer) => layer.id === poiState.layer?.id) || null;
	});

	$effect(() => {
		if (poiState.layer && cardRef && mapContainer) {
			cardVisible = false;

			cardPosition = {
				top: clickPoint.y,
				left: clickPoint.x
			};

			setTimeout(() => {
				updateCardPosition();
				cardVisible = true;
			}, 0);
		} else {
			cardVisible = false;
		}
	});

	$effect(() => {
		if (activeLayer && poiState.properties) {
			content = activeLayer.getContent ? activeLayer.getContent(poiState.properties) : {};
		} else {
			content = {};
		}
	});

	$effect(() => {
		title = activeLayer?.label || 'Details';
	});

	function updateCardPosition() {
		if (!cardRef || !mapContainer) return;

		const mapRect = mapContainer.getBoundingClientRect();
		const cardRect = cardRef.getBoundingClientRect();
		const iconSize = 24;
		const legendHeight = 48;

		let left = clickPoint.x + iconSize + 8;
		let top = clickPoint.y - cardRect.height / 2;
		tipPosition = 'left';

		if (left + cardRect.width > mapRect.width - 12) {
			left = clickPoint.x - cardRect.width - 8;
			tipPosition = 'right';
		}

		if (left < 12) {
			left = Math.max(12, clickPoint.x - cardRect.width / 2);
			top = clickPoint.y - cardRect.height - iconSize - 8;
			tipPosition = 'bottom';

			if (top < 12) {
				top = clickPoint.y + iconSize + 8;
				tipPosition = 'top';
			}
		}

		if (top < 24) {
			top = 24;
		}

		if (top + cardRect.height > mapRect.height - legendHeight - 12) {
			top = mapRect.height - legendHeight - cardRect.height - 12;
		}

		cardPosition = { top, left };
	}

	function resetPOIState() {
		cardVisible = false;
		poiState.layer = null;
		poiState.properties = null;
		activeLayer = null;
	}
</script>

{#if poiState && cardPosition}
	<div
		class="DetailsCard-root absolute top-2 right-2 z-20 w-64"
		style="top: {cardPosition.top}px; left: {cardPosition.left}px; opacity: {cardVisible
			? '1'
			: '0'}; visibility: {cardVisible
			? 'visible'
			: 'hidden'}; transition: opacity 0.15s ease-in-out;"
		bind:this={cardRef}
	>
		<!-- <div
			class="card-tip card-tip-{tipPosition} card-tip-top"
			style="transform: translateX({tipGeom.x}%); transform: translateY({tipGeom.y}%);"
		> -->
		<div class="card-tip card-tip-{tipPosition}">
			<svg
				width="18"
				height="17"
				viewBox="0 0 18 17"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M8.14344 2.35963C8.53219 1.71435 9.46781 1.71435 9.85657 2.35963L16.7091 13.734C17.1106 14.4005 16.6306 15.25 15.8525 15.25H2.14751C1.36941 15.25 0.889414 14.4005 1.29094 13.734L8.14344 2.35963Z"
					fill="#F1F0F5"
				/>
				<path
					d="M8.14344 2.35963C8.53219 1.71435 9.46781 1.71435 9.85657 2.35963L16.7091 13.734"
					stroke="#5D508B"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M1.29094 13.734L8.14344 2.35963"
					stroke="#5D508B"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>

		<Card.Root class="w-64">
			<Card.Header>
				<Card.Title class="items-center"
					>{title}
					<button
						class="text-purple-dark m-0 cursor-pointer bg-transparent p-0"
						onclick={() => resetPOIState()}
					>
						<CloseOutline fill="#5d508b" size={24} />
					</button>
				</Card.Title>
			</Card.Header>

			<Card.Content>
				<ul>
					{#each Object.entries(content) as [key, value]}
						<li
							class="flex justify-between gap-2 px-4 py-2"
							style={`display: ${typeof value === 'boolean' ? 'flex' : 'block'}; flex-direction: ${typeof value === 'boolean' ? 'row' : 'column'}`}
						>
							<p class="text-grey-mid font-bold">{key}</p>
							{#if typeof value === 'boolean'}
								<p>
									{#if value}
										<Checkmark fill="#00AA84" size={24} />
									{:else}
										<CloseLarge fill="#E40422" size={24} />
									{/if}
								</p>
							{:else}
								<p>{value}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	</div>
{/if}

<style>
	/* Card tip base properties */
	.card-tip {
		position: absolute;
		width: 0;
		height: 0;
		z-index: 1;
	}

	/* Arrow pointing down (placed at top of card) */
	.card-tip-top {
		top: -12.5px;

		/* left dynamisch X ACHSE */
		left: 10px;
	}
	.card-tip-bottom {
		bottom: -12.5px;
		transform: rotate(180deg);

		/* left dynamisch X ACHSE */
		left: 30px;
	}
	.card-tip-bottom svg path,
	.card-tip-left svg path,
	.card-tip-right svg path {
		fill: #fff;
	}
	.card-tip-left {
		left: -12.5px;
		transform: rotate(-90deg);

		/* top dynamisch Y ACHSE */
		top: 70px;
	}
	.card-tip-right {
		right: -12.5px;
		transform: rotate(90deg);

		/* top dynamisch Y ACHSE */
		top: 40px;
	}
</style>
