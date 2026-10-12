<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { poiLayers } from '$lib/config/poi';
	import { layerState } from '$lib/state/layerState.svelte';
	import { t } from '$lib/translations';

	let isOpen = $state(false);
	const layers = poiLayers();

	const toggleIsOpen = $derived(() => {
		isOpen = !isOpen;
	});
</script>

<div class="legend-root absolute bottom-0 left-1/2 z-10 w-full max-w-116 -translate-x-1/2 px-2">
	<Accordion
		type="single"
		class="legend-root border-purple-dark center shadow-[0px_0px_16px_0px_rgba(0, 0, 0, 0.64)]  w-full overflow-hidden rounded-t-lg border-t-2 border-r-2 border-l-2 bg-white"
	>
		<AccordionItem value="legend">
			<AccordionTrigger
				class="text-purple-dark flex w-full cursor-pointer justify-center gap-3 px-2 py-3"
				style={isOpen ? 'background-color: #F1F0F5' : ''}
				onclick={toggleIsOpen}
			>
				<p class="text-purple-dark body-large-bold text-center">
					{!isOpen ? $t('map.legend.button_open') : $t('map.legend.button_close')}
				</p>
			</AccordionTrigger>
			<AccordionContent>
				<ul class="flex flex-col gap-6 px-6 pt-2">
					{#each layers as layer (layer.layerId)}
						<li class="body-large flex items-center justify-between gap-2">
							<div class="flex items-center gap-4">
								<img src={layer.legendIcon} alt="" class="size-8 object-contain" />
								<label for={layer.layerId}>{$t(layer.label)}</label>
							</div>
							<Checkbox
								class="cursor-pointer"
								id={layer.layerId}
								checked={layerState.isVisible(layer.layerId)}
								onCheckedChange={() => layerState.toggleLayerVisibility(layer.layerId)}
							/>
						</li>
					{/each}
				</ul>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
