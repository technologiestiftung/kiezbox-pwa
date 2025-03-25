<script lang="ts">
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import InfoBox from '../components/InfoBox.svelte';
	import Notruf from '../components/EmergencyCall.svelte';
	import SpeechBubble from '../components/SpeechBubble.svelte';
	import TabView from '../components/TabView.svelte';
	import Ticker from '../components/Ticker.svelte';

	import Modal from '../components/Modal.svelte';
	import Header from '../components/Header.svelte';
	import MainContent from '../components/MainContent.svelte';
	let showModal = $state(false);

	let isEmergency = $state(false);

	const triggerCall = () => {
		isEmergency = !isEmergency;
	};
</script>

<div class="page-root mx-auto w-[375px]">
	<Header></Header>
	<EmergencyCall {isEmergency} buttons={[{ isActive: false, onClick: triggerCall }]}
	></EmergencyCall>
	<MainContent></MainContent>
</div>

<style></style>
