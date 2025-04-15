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
	let arrowPosition = $state({ left: '50%', top: '0', transform: 'translateX(-50%)' });

	type ArrowDirection = 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
	let arrowDirection = $state<ArrowDirection>('bottom');

	const arrowConfigs = {
		top: {
			containerClass: 'absolute  ',
			outerArrowClass:
				'absolute -translate-x-1/2 border-purple-dark -top-[2px] h-0 w-0 border-b-[10px] border-r-[10px] border-l-[10px] border-r-transparent border-l-transparent',
			innerArrowClass:
				'absolute top-[1px] -translate-x-1/2  h-0 w-0 border-b-[10px] border-r-[10px] border-l-[10px] border-b-purple-light border-r-transparent border-l-transparent'
		},
		bottom: {
			containerClass: 'absolute left-0 -translate-x-1/2',
			outerArrowClass:
				'absolute  -translate-x-1/2  border-purple-dark  bottom-0 h-0 w-0 border-t-[10px] border-r-[10px] border-l-[10px] border-r-transparent border-l-transparent',
			innerArrowClass:
				'absolute  -translate-x-1/2  bottom-[3px] h-0 w-0 border-t-[10px] border-r-[10px] border-l-[10px] border-t-white border-r-transparent border-l-transparent'
		},
		topLeft: {
			containerClass: 'absolute',
			outerArrowClass:
				'border-purple-dark translate-1/2  absolute -top-[1px] -left-[1px] h-0 w-0 border-b-[6px] border-r-[6px] border-b-transparent border-r-transparent border-t-[9px] border-l-[9px]',
			innerArrowClass:
				'absolute top-[2px] translate-1/2  left-[2px] h-0 w-0  border-t-[8px] border-b-[5px] border-r-[5px] border-l-[8px] border-b-transparent border-r-transparent border-t-purple-light border-l-purple-light '
		},
		topRight: {
			containerClass: 'absolute',
			outerArrowClass:
				'border-purple-dark -translate-x-1/2 translate-y-1/2  absolute -top-[1px] -right-[1px] h-0 w-0 border-b-[6px] border-l-[6px] border-b-transparent border-l-transparent border-t-[9px] border-r-[9px]',
			innerArrowClass:
				'absolute top-[2px] -translate-x-1/2 translate-y-1/2 right-[2px] h-0 w-0 border-b-[5px] border-l-[5px] border-r-[8px] border-t-[8px] border-b-transparent border-l-transparent border-t-purple-light border-r-purple-light'
		},
		bottomLeft: {
			containerClass: 'absolute',
			outerArrowClass:
				'border-purple-dark  translate-x-1/2 -translate-y-1/2  absolute -bottom-[1px] -left-[1px] h-0 w-0 border-t-[6px] border-r-[6px] border-t-transparent border-r-transparent border-b-[9px] border-l-[9px]',
			innerArrowClass:
				'translate-x-1/2 -translate-y-1/2  absolute bottom-[2px] left-[2px] h-0 w-0 border-t-[5px] border-l-[8px] border-r-[5px] border-t-transparent border-b-[8px] border-r-transparent border-b-white border-l-white'
		},
		bottomRight: {
			containerClass: 'absolute',
			outerArrowClass:
				'border-purple-dark -translate-1/2  absolute  -bottom-[1px] -right-[1px] h-0 w-0 border-t-[6px] border-l-[6px] border-t-transparent border-l-transparent border-b-[9px] border-r-[9px] ',
			innerArrowClass:
				'-translate-1/2  absolute  bottom-[2px] right-[2px] h-0 w-0 border-t-[5px] border-l-[5px] border-r-[8px] border-t-transparent  border-b-[8px] border-l-transparent border-b-white border-r-white'
		}
	};

	function updateArrowDirection() {
		if (!cardRef || !mapState.popup || !mapState.map) return;

		const cardRect = cardRef.getBoundingClientRect();
		const mapCanvas = mapState.map.getCanvas().getBoundingClientRect();

		let featureX = 0;
		let featureY = 0;
		let foundPosition = false;

		if (mapState.popup._pos) {
			featureX = mapState.popup._pos.x + mapCanvas.left;
			featureY = mapState.popup._pos.y + mapCanvas.top;
			foundPosition = true;
		}

		if (!foundPosition) {
			return;
		}

		const margin = 8;

		const cardLeft = cardRect.left + margin;
		const cardTop = cardRect.top + margin;
		const cardWidth = cardRect.width - margin * 2;
		const cardHeight = cardRect.height - margin * 2;
		const cardCenterX = cardLeft + cardWidth / 2;
		const cardCenterY = cardTop + cardHeight / 2;

		const dx = cardCenterX - featureX;
		const dy = cardCenterY - featureY;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		const isCornerCase = absDx > cardWidth * 0.35 && absDy > cardHeight * 0.35;

		if (isCornerCase) {
			console.log('Corner case detected early');
			if (dx > 0 && dy > 0) {
				arrowDirection = 'topLeft';
				arrowPosition = { left: '0', top: '0', transform: 'translate(-50%, -50%)' };
			} else if (dx < 0 && dy > 0) {
				arrowDirection = 'topRight';
				arrowPosition = { left: '100%', top: '0', transform: 'translate(50%, -50%)' };
			} else if (dx > 0 && dy < 0) {
				arrowDirection = 'bottomLeft';
				arrowPosition = { left: '0', top: '100%', transform: 'translate(-50%, 50%)' };
			} else {
				arrowDirection = 'bottomRight';
				arrowPosition = { left: '100%', top: '100%', transform: 'translate(50%, 50%)' };
			}
		} else if (dy > 0) {
			arrowDirection = 'top';
			const relativeX = Math.max(0, Math.min(cardWidth, featureX - cardLeft + margin));
			arrowPosition = {
				left: `${relativeX}px`,
				top: '0',
				transform: 'translateY(-50%)'
			};
		} else {
			arrowDirection = 'bottom';
			const relativeX = Math.max(0, Math.min(cardWidth, featureX - cardLeft + margin));
			arrowPosition = {
				left: `${relativeX}px`,
				top: '100%',
				transform: 'translateY(50%)'
			};
		}
	}

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

	$effect(() => {
		if (cardRef && mapState.popup) {
			setTimeout(updateArrowDirection, 100);
			if (mapState.map) {
				mapState.map.on('move', updateArrowDirection);
				return () => {
					mapState.map?.off('move', updateArrowDirection);
				};
			}
		}
	});

	onMount(() => {
		if (!cardRef) return;
		mapState.cardRef = cardRef;
		window.addEventListener('resize', updateArrowDirection);
		return () => {
			window.removeEventListener('resize', updateArrowDirection);
			if (mapState.map) {
				mapState.map?.off('click', () => null);
			}
		};
	});

	function handlePopupClose() {
		if (mapState.popup) {
			mapState.popup.remove();
		}
	}
</script>

<div bind:this={cardRef} class="kb-popup transition-transform ease-in-out">
	<div
		class={`${arrowConfigs[arrowDirection].containerClass} z-10`}
		style="left: {arrowPosition.left}; top: {arrowPosition.top}; transform: {arrowPosition.transform};"
	>
		<div class="relative">
			<div class={arrowConfigs[arrowDirection].outerArrowClass}></div>
			<div class={arrowConfigs[arrowDirection].innerArrowClass}></div>
		</div>
	</div>

	<Card.Root class="relative m-2 w-60">
		<Card.Header>
			<Card.Title class="flex items-center justify-between">
				<span>{title}</span>
				<button class="text-purple-dark cursor-pointer bg-transparent" onclick={handlePopupClose}>
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
