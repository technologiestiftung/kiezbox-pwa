<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { selectedPOI } from '$lib/stores/poiStore';

	let content = $state({});

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

	// Dynamic title based on selected POI type
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
	<div class="DetailsCard-root absolute top-2 right-2 z-10 w-64">
		<Card.Root>
			<Card.Header>
				<Card.Title
					>{getTitle()}

					<button
						type="reset"
						class="DetailsCard-close-button text-purple-dark m-0 cursor-pointer bg-transparent p-0"
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
	</div>
{/if}
