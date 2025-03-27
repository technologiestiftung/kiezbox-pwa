<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { poiState } from '$lib/state/state.svelte';
	import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
	import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
	import CloseOutline from 'carbon-icons-svelte/lib/CloseOutline.svelte';
	import { onMount } from 'svelte';

	const { clickPoint = { x: 0, y: 0 }, mapContainer } = $props();

	let cardRef = $state<HTMLDivElement | null>(null);
	let cardPosition = $state({ top: clickPoint.y, left: clickPoint.x });
	let content = $state({});

	function updateCardPosition() {
		if (!cardRef || !mapContainer) return;
		const mapRect = mapContainer.getBoundingClientRect();
		const cardRect = cardRef.getBoundingClientRect();

		let top = clickPoint.y - cardRect.height - 32;
		let left = clickPoint.x - cardRect.width / 2;

		if (top < 12) {
			top = clickPoint.y + 24;
		}
		if (left < 12) {
			left = 12;
		}
		if (left + cardRect.width > mapRect.width - 12) {
			left = mapRect.width - cardRect.width - 12;
		}
		if (top + cardRect.height > mapRect.height - 32) {
			top = mapRect.height - cardRect.height - 32;
		}

		cardPosition = { top, left };
	}

	$effect(() => {
		if (cardRef && mapContainer) {
			// Initial position
			// todo: only display the card when the card position is calculated
			cardPosition = {
				top: clickPoint.y - 250, // Initial guess at card height
				left: clickPoint.x - 128 // Half of w-64 (256px/2 = 128px)
			};
			setTimeout(updateCardPosition, 0);
		}
	});

	onMount(() => {
		const handleResize = () => {
			updateCardPosition();
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	$effect(() => {
		if (poiState) {
			if (poiState.layer.id === 'toilets-layer') {
				content = {
					Kostenfrei: poiState.properties.nutzungsentgelt === 0 ? true : false,
					Barrierefrei: poiState.properties.barrierefrei === 'ja' ? true : false,
					Wickeltisch: poiState.properties.wickeltisch === 'ja' ? true : false,
					Pissoir: poiState.properties.kostenfreies_pissoir === 'ja' ? true : false
				};
			}
			if (poiState.layer.id === 'water-pumps-layer') {
				content = {
					Status: poiState.properties['pump:status'] === 'ok' ? 'funktioniert' : 'kaputt',
					Trinkwasser: poiState.properties.drinking_water === 'yes' ? true : false,
					Überprüft_am: poiState.properties.check_date
				};
			}
			if (poiState.layer.id === 'drinking-water-layer') {
				content = {
					Name: poiState.properties.bezeichnun
				};
			}
			if (poiState.layer.id === 'defies-layer') {
				content = {
					Öffnungszeiten: poiState.properties.opening_hours || 'unbekannt',
					Location:
						poiState.properties['defibrillator:location'] ||
						poiState.properties['defibrillator:location:de'] ||
						'unbekannt',
					Telefon: poiState.properties.phone || poiState.properties['contact:phone'] || 'unbekannt',
					Operator:
						poiState.properties.operator ||
						poiState.properties['defibrillator:wikipedia'] ||
						'unbekannt'
				};
			}
		}
	});

	let getTitle = () => {
		switch (poiState.layer.id) {
			case 'toilets-layer':
				return 'Öffentliche Toilette';
			case 'water-pumps-layer':
				return 'Wasserpumpe';
			case 'drinking-water-layer':
				return 'Trinkwasser';
			case 'defies-layer':
				return 'Defibrillatoren';
			default:
				return 'Details';
		}
	};

	function resetPOIState() {
		poiState.layer = null;
		poiState.properties = null;
	}
</script>

{#if poiState && cardPosition}
	<div
		class="DetailsCard-root absolute top-2 right-2 z-20 w-64"
		style="top: {cardPosition.top}px; left: {cardPosition.left}px;"
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
