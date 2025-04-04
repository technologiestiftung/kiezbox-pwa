<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { LAYER_CONFIG } from '$lib/config/layers';
	import { mapState, poiState } from '$lib/state/state.svelte';
	import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
	import CloseLarge from 'carbon-icons-svelte/lib/CloseLarge.svelte';
	import CloseOutline from 'carbon-icons-svelte/lib/CloseOutline.svelte';
	import { onMount } from 'svelte';

	let cardRef: HTMLDivElement | undefined = $state();

	let content = $state({});
	let title = $state('Details');
	let activeLayer = $state<(typeof LAYER_CONFIG)[number] | null>(null);

	$effect(() => {
		activeLayer = LAYER_CONFIG.find((layer) => layer.id === poiState.layer?.id) || null;
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

	onMount(() => {
		if (!cardRef) return;
		mapState.cardRef = cardRef;
	});

	function handlePopupClose() {
		if (mapState.popup) {
			mapState.popup.remove();
		}
	}
</script>

<div bind:this={cardRef} class="kb-popup">
	<Card.Root class="w-64">
		<Card.Header>
			<Card.Title class="items-center"
				>{title}
				<button
					class="text-purple-dark m-0 cursor-pointer bg-transparent p-0"
					onclick={() => handlePopupClose()}
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
