<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let isOpen = $state(false);

	function toggleIsOpen() {
		isOpen = !isOpen;
	}

	// todo: toggle layer when checkbox is clicked
</script>

<div class="Legend-root absolute right-0 bottom-0 left-0 z-10 flex w-full justify-center px-2">
	<Accordion
		class="border-purple-dark center w-full max-w-[29rem] overflow-hidden rounded-t-[4px] border-t-2 border-r-2 border-l-2 bg-white shadow-lg"
	>
		<AccordionItem value="legend">
			<AccordionTrigger
				class="text-purple-dark flex w-full justify-center gap-3 px-2 py-3"
				style={isOpen ? 'background-color: #F1F0F5' : ''}
				on:click={toggleIsOpen}
			>
				<p class="text-purple-dark body-large-bold text-center">
					{#if isOpen}
						Legende schließen
					{:else}
						Legende öffnen
					{/if}
				</p>
			</AccordionTrigger>
			<AccordionContent>
				<ul class="flex flex-col gap-6 px-6 pt-2">
					<li class="body-large flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<div>Icon</div>
							<label for="drinkingWater">Trinkwasser</label>
						</div>
						<Checkbox id="drinkingWater" checked />
					</li>
					<li class="body-large flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<div>Icon</div>
							<label for="waterPump">Wasserpumpe</label>
						</div>
						<Checkbox id="waterPump" checked />
					</li>
					<li class="body-large flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<div>Icon</div>
							<label for="toilet">Öffentliche Toilette</label>
						</div>
						<Checkbox id="toilet" checked />
					</li>
					<li class="body-large flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<div>Icon</div>
							<label for="defies">Defibrillatoren</label>
						</div>
						<Checkbox id="defies" checked />
					</li>
				</ul>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
