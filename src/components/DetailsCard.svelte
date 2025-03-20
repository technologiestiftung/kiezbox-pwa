<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { selectedPOI } from '$lib/stores/poiStore';
	import { onMount } from 'svelte';

	const { clickPoint = { x: 0, y: 0 }, mapContainer } = $props();

	let isAbovePOI = false;
	let cardRef = $state<HTMLDivElement | null>(null);
	let cardPosition = $state({ top: clickPoint.y, left: clickPoint.x });

	let content = $state({});

	function updateCardPosition() {
		if (!cardRef || !mapContainer) return;
		const mapRect = mapContainer.getBoundingClientRect();
		const cardRect = cardRef.getBoundingClientRect();

		let top = clickPoint.y - cardRect.height - 12;
		let left = clickPoint.x - cardRect.width / 2;

		if (top < 12) {
			top = clickPoint.y + 15;
		}
		if (left < 12) {
			left = 12;
		}
		if (left + cardRect.width > mapRect.width - 12) {
			left = mapRect.width - cardRect.width - 12;
		}
		if (top + cardRect.height > mapRect.height - 12) {
			top = mapRect.height - cardRect.height - 12;
		}

		cardPosition = { top, left };
	}

	$effect(() => {
		if (cardRef && mapContainer) {
			// Initial position
			cardPosition = {
				top: clickPoint.y - 150, // Initial guess at card height
				left: clickPoint.x - 128 // Half of w-64 (256px/2 = 128px)
			};
			setTimeout(updateCardPosition, 0);
		}
	});

	onMount(() => {
		const handleResize = () => updateCardPosition();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	$effect(() => {
		if ($selectedPOI) {
			if ($selectedPOI.layer.id === 'toilets-layer') {
				content = {
					Kostenfrei: $selectedPOI.properties.nutzungsentgelt === 0 ? true : false,
					Barrierefrei: $selectedPOI.properties.barrierefrei === 'ja' ? true : false,
					Wickeltisch: $selectedPOI.properties.wickeltisch === 'ja' ? true : false,
					Pissoir: $selectedPOI.properties.kostenfreies_pissoir === 'ja' ? true : false
				};
			}
			if ($selectedPOI.layer.id === 'water-pumps-layer') {
				content = {
					Status: $selectedPOI.properties['pump:status'] === 'ok' ? 'funktioniert' : 'kaputt',
					Trinkwasser: $selectedPOI.properties.drinking_water === 'yes' ? true : false,
					Überprüft_am: $selectedPOI.properties.check_date
				};
			}
			if ($selectedPOI.layer.id === 'drink-water-layer') {
				content = {
					Name: $selectedPOI.properties.bezeichnun
				};
			}
		}
	});

	let getTitle = () => {
		if (!$selectedPOI) return '';

		switch ($selectedPOI.layer.id) {
			case 'toilets-layer':
				return 'Öffentliche Toilette';
			case 'water-pumps-layer':
				return 'Wasserpumpe';
			case 'drink-water-layer':
				return 'Trinkwasserbrunnen';
			default:
				return 'Details';
		}
	};
</script>

{#if $selectedPOI}
	<div
		class="DetailsCard-root absolute top-2 right-2 z-10 w-64"
		style="top: {cardPosition.top}px; left: {cardPosition.left}px; transition: all 0.2s ease-out;"
		bind:this={cardRef}
	>
		<Card.Root class="w-64">
			<Card.Header>
				<Card.Title
					>{getTitle()}

					<button
						class="text-purple-dark m-0 cursor-pointer bg-transparent p-0"
						onclick={() => selectedPOI.set(null)}>×</button
					>
				</Card.Title>
			</Card.Header>

			<Card.Content>
				<ul>
					{#each Object.entries(content) as [key, value]}
						<li class="flex flex-col justify-between gap-2 px-4 py-2">
							<p class="text-grey-mid font-bold">{key}</p>
							{#if typeof value === 'boolean'}
								<div class="flex justify-between">
									<p>
										{value ? 'Ja' : 'Nein'}
									</p>
									<p>
										{value ? '✅' : '❌'}
									</p>
								</div>
							{:else}
								<p>
									{value}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
		<div class={`card-pointer ${isAbovePOI ? 'card-pointer-bottom' : 'card-pointer-top'}`}></div>
	</div>
{/if}

<style>
	.card-container {
		position: relative;
	}
	/* Triangle pointer styles */
	.pointer {
		position: absolute;
		width: 0;
		height: 0;
		border-style: solid;
	}
	.pointer-bottom {
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		border-width: 10px 10px 0;
		border-color: pink transparent transparent;
	}

	.pointer-top {
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		border-width: 0 10px 10px;
		border-color: transparent transparent pink;
	}
	.pointer-left {
		left: -10px;
		top: 50%;
		transform: translateY(-50%);
		border-width: 10px 10px 10px 0;
		border-color: transparent pink transparent transparent;
	}

	.pointer-right {
		right: -10px;
		top: 50%;
		transform: translateY(-50%);
		border-width: 10px 0 10px 10px;
		border-color: transparent transparent transparent pink;
	}
</style>
