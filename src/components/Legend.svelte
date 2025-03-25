<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { mapState } from '$lib/state/state.svelte';

	const LAYER_CONFIG = [
		{
			id: 'drinking-water-layer',
			label: 'Trinkwasser',
			icon: '/icons/drinking-water.svg',
			alt: 'Trinkwasser Icon'
		},
		{
			id: 'water-pumps-layer',
			label: 'Wasserpumpe',
			icon: '/icons/water-pump.svg',
			alt: 'Wasserpumpe Icon'
		},
		{
			id: 'toilets-layer',
			label: 'Öffentliche Toilette',
			icon: '/icons/toilet.svg',
			alt: 'Toiletten Icon'
		},
		{
			id: 'defies-layer',
			label: 'Defibrillatoren',
			icon: '/icons/defie.svg',
			alt: 'Defibrillator Icon'
		}
	];

	let isOpen = $state(false);

	const toggleIsOpen = $derived(() => {
		isOpen = !isOpen;
	});

	function toggleLayer(layerId: string, isVisible: boolean): void {
		if (!mapState.map) return;
		mapState.map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
	}
</script>

<div class="legend-root absolute right-0 bottom-0 left-0 z-10 flex w-full justify-center px-2">
	<Accordion
		class="border-purple-dark center shadow-[0px_0px_16px_0px_rgba(0, 0, 0, 0.64)] w-full max-w-[29rem] overflow-hidden rounded-t-[4px] border-t-2 border-r-2 border-l-2 bg-white"
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
								checked
								onCheckedChange={(v) => toggleLayer(layer.id, v as boolean)}
							/>
						</li>
					{/each}
				</ul>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
