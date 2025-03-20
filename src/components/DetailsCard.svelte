<script>
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
	<div class="detailsCard-root">
		<div class="detailsCard-header">
			<h3>{getTitle()}</h3>
			<button class="detailsCard-close-btn" onclick={() => selectedPOI.set(null)}>✖</button>
		</div>
		<div class="detailsCard-content">
			<ul>
				{#each Object.entries(content) as [key, value]}
					<li>
						<span>{key}:</span>
						{#if typeof value === 'boolean'}
							{value ? '✅' : '❌'}
						{:else}
							{value}
						{/if}
					</li>
				{/each}
			</ul>
		</div>
		<div class="detailsCard-arrow"></div>
	</div>
{/if}

<style>
	.detailsCard-root {
		position: absolute;
		top: 50px;
		left: 50px;
		background-color: white;
		border-radius: 8px;
		box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15);
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
	}

	.detailsCard-root h3 {
		margin: 0 !important;
	}

	.detailsCard-header {
		overflow: hidden;
		background-color: #f1f0f5;
		display: flex;
		gap: 8px;
		padding: 8px 16px;
		justify-content: space-between;
		align-items: center;
	}

	.detailsCard-content {
		padding: 12px;
		width: 100%;
		text-align: left;
		font-family: sans-serif;
	}

	.detailsCard-root h3 {
		margin: 0 0 10px;
		font-size: 14px;
		color: #333;
	}

	.detailsCard-root ul {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 12px;
	}

	.detailsCard-root ul li {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.detailsCard-root ul li span {
		font-weight: bold;
		color: #444;
	}

	.detailsCard-arrow {
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 10px solid white;
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
	}

	.detailsCard-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		padding: 0;
		color: #666;
	}

	.detailsCard-close-btn:hover {
		color: #000;
	}
</style>
