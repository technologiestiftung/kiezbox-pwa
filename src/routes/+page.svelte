<script lang="ts">
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import InfoBox from '../components/InfoBox.svelte';
	import SpeechBubble from '../components/SpeechBubble.svelte';
	import Ticker from '../components/Ticker.svelte';
</script>

<div class="page-root mx-auto max-w-[800px] p-4">
	<h1>Kiezbox Notfallapp</h1>

	<h2>Aktuelle News</h2>
	<Ticker />

	<h1>EmergencyCall</h1>
	<EmergencyCall />

	<InfoBox
		title={'Essen und Trinken'}
		textBodyOrList={'Wir empfehlen einen Vorrat an Lebensmitteln für mind. 3 Tage pro Person. Des weiteren sollten Sie mind. 1,5l Trinkwasser und 0,5l Wasser pro Tag zum Kochen und für Hygiene einplanen.'}
		links={[{ href: 'Vorratskalkulator des Bundes', text: 'Vorratskalkulator des Bundes' }]}
	></InfoBox>
</div>

<style></style>
