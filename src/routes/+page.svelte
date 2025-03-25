<script lang="ts">
	import PhoneMenu from '../components/PhoneMenu.svelte';
	import Modal from '../components/Modal.svelte';
	import Header from '../components/Header.svelte';
	import MainContent from '../components/MainContent.svelte';
	import DemoCall from '../components/DemoCall.svelte';
	import EmergencyCall from '../components/EmergencyCall.svelte';
	import Footer from '../components/Footer.svelte';
	let showModal = $state(true);

	let isEmergency = $state(true);
	let isCall = $state(false);

	const triggerCall = () => {
		isCall = !isCall;
	};

	const triggerInitCall = () => {
		isEmergency = !isEmergency;
		showModal = !showModal;
	};
</script>

<div class="page-root mx-auto h-full w-[375px] scroll-auto">
	<Header></Header>
	<PhoneMenu {isEmergency} onClick={triggerInitCall}></PhoneMenu>
	<MainContent></MainContent>
	<Footer></Footer>
	<Modal bind:showModal>
		{#snippet children()}
			{#if isEmergency}
				<DemoCall {isCall} activateCall={triggerCall} />
			{:else}
				<EmergencyCall {isCall} activateCall={triggerCall} />
			{/if}
		{/snippet}
	</Modal>
</div>

<style></style>
