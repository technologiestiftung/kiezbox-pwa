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
	let activeLayer = $state(LAYER_CONFIG.find((layer) => layer.id === poiState.layer?.id) || null);
	let cardVisible = $state(false);

	onMount(() => {
		const handleResize = () => {
			updateCardPosition();
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	$effect(() => {
		if (cardRef && mapContainer) {
			cardVisible = false;

			cardPosition = {
				top: clickPoint.y,
				left: clickPoint.x
			};

			setTimeout(() => {
				updateCardPosition();
				cardVisible = true;
			}, 0);
		}
	});

	$effect(() => {
		if (poiState && activeLayer) {
			content = activeLayer.getContent ? activeLayer.getContent(poiState.properties) : {};
		}
	});

	function updateCardPosition() {
		if (!cardRef || !mapContainer) return;

		const mapRect = mapContainer.getBoundingClientRect();
		const cardRect = cardRef.getBoundingClientRect();
		const iconSize = 24;
		const legendHeight = 48;

		let left = clickPoint.x + iconSize + 8;
		let top = clickPoint.y - cardRect.height / 2;

		if (left + cardRect.width > mapRect.width - 12) {
			left = clickPoint.x - cardRect.width - 8;
		}

		if (left < 12) {
			left = Math.max(12, clickPoint.x - cardRect.width / 2);
			top = clickPoint.y - cardRect.height - iconSize - 8;

			if (top < 12) {
				top = clickPoint.y + iconSize + 8;
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

	function getTitle() {
		return activeLayer?.label || 'Details';
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
		<Card.Root class="w-64">
			<Card.Header>
				<Card.Title class="items-center"
					>{getTitle()}
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
