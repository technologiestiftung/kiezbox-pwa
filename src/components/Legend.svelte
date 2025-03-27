<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { LAYER_CONFIG } from '$lib/config/layers';
	import { layerState } from '$lib/state/layerState.svelte';

	let isOpen = $state(false);

	const toggleIsOpen = $derived(() => {
		isOpen = !isOpen;
	});
</script>

<div class="legend-root absolute bottom-0 left-1/2 z-10 w-full max-w-[29rem] -translate-x-1/2 px-2">
	<Accordion
		class="legend-root border-purple-dark center shadow-[0px_0px_16px_0px_rgba(0, 0, 0, 0.64)]  w-full overflow-hidden rounded-t-[4px] border-t-2 border-r-2 border-l-2 bg-white"
	>
		<AccordionItem value="legend">
			<AccordionTrigger
				class="text-purple-dark flex w-full justify-center gap-3 px-2 py-3"
				style={isOpen ? 'background-color: #F1F0F5' : ''}
				on:click={toggleIsOpen}
			>
				<p class="text-purple-dark body-large-bold text-center">
					{isOpen ? 'Legende schließen' : 'Legende öffnen'}
				</p>
			</AccordionTrigger>
			<AccordionContent>
				<ul class="flex flex-col gap-6 px-6 pt-2">
					{#each LAYER_CONFIG as layer}
						<li class="body-large flex items-center justify-between gap-2">
							<div class="flex items-center gap-4">
								<img src={layer.icon} alt={layer.alt} />
								<label for={layer.id}>{layer.label}</label>
							</div>
							<Checkbox
								id={layer.id}
								checked={layerState.layerVisibility[layer.id] === 'visible'}
								onCheckedChange={() => layerState.toggleLayerVisibility(layer.id)}
							/>
						</li>
					{/each}
				</ul>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
