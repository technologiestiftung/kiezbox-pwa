<script lang="ts">
	import { createMapStore, MAPSTORE_CONTEXT_KEY } from '$lib/stores';
	import { setContext } from 'svelte';
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import Header from '../components/Header.svelte';
	import InfoBox from '../components/InfoBox.svelte';
	import Map from '../components/Map.svelte';
	import Modal from '../components/Modal.svelte';
	import Notruf from '../components/Notruf.svelte';
	import SpeechBubble from '../components/SpeechBubble.svelte';
	import TabView from '../components/TabView.svelte';

	const mapStore = createMapStore();
	setContext(MAPSTORE_CONTEXT_KEY, mapStore);

	let showModal = $state(false);
	let isEmergency = $state(false);
	const triggerCall = () => {
		isEmergency = !isEmergency;
	};
</script>

<div class="page-root mx-auto max-w-[800px] p-8">
	<Header></Header>

	<h1>EmergencyCall</h1>
	<EmergencyCall />

	<TabView />
	<InfoBox
		header={'Essen und Trinken'}
		textBodyOrList={'Wir empfehlen einen Vorrat an Lebensmitteln für mind. 3 Tage pro Person. Des weiteren sollten Sie mind. 1,5l Trinkwasser und 0,5l Wasser pro Tag zum Kochen und für Hygiene einplanen.'}
		links={[{ href: 'Vorratskalkulator des Bundes', text: 'Vorratskalkulator des Bundes' }]}
	></InfoBox>

	<SpeechBubble
		header={'1. Wo ist das Ereignis?'}
		children={'Geben Sie den Ort des Ereignisses so genau wie möglich an (zum Beispiel Gemeindename oder Stadtteil, Straßenname, Hausnummer, etc.)'}
	></SpeechBubble>

	<SpeechBubble
		header={'2. Wer ruft an?'}
		children={'Nennen Sie Ihren Namen, Ihren Standort und Ihre Telefonnummer für Rückfragen!'}
	></SpeechBubble>

	<Notruf {isEmergency} onClick={() => triggerCall()}></Notruf>

	<button onclick={() => (showModal = true)}> show modal </button>
	<Modal bind:showModal>
		{#snippet children()}
			{'Nennen Sie Ihren Namen, Ihren Standort und Ihre Telefonnummer für Rückfragen!'}
		{/snippet}
	</Modal>

	<Map />
</div>

<style></style>
