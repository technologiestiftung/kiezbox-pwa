<script lang="ts">
	import Dialer from './EmergencyCallComponents/Dialer.svelte';
	import Modal from './Modal.svelte';
	import DemoCallInfo from './EmergencyCallComponents/DemoCallInfo.svelte';
	import EmergencyCallInfo from './EmergencyCallComponents/EmergencyCallInfo.svelte';
	import { t } from '$lib/translations';
	import CallScreen from './EmergencyCallComponents/CallScreen.svelte';
	let showModal = $state(true);

	let isEmergency = $state(true);
	let isCall = $state(false);
	let isMicrophone = $state(false);
	let isSpeaker = $state(false);

	const activateCall = () => {
		isCall = !isCall;
	};

	const triggerInitCall = () => {
		isEmergency = !isEmergency;
		showModal = !showModal;
	};

	const buttonText = $derived(
		isEmergency
			? !isCall
				? $t('content.emergency_phone.emergency.offline.call_button')
				: $t('content.emergency_phone.emergency.online.call_button')
			: !isCall
				? $t('content.emergency_phone.default.offline.call_button')
				: $t('content.emergency_phone.default.online.call_button')
	);

	const activateMic = () => {
		isMicrophone = !isMicrophone;
	};
	const activateSpeaker = () => {
		isSpeaker = !isSpeaker;
	};
</script>

<Dialer {isEmergency} onClick={triggerInitCall}></Dialer>
<Modal bind:showModal>
	{#snippet children()}
		<div class="phone-root flex w-full flex-grow flex-col justify-between space-y-8 py-6">
			{#if isEmergency}
				<EmergencyCallInfo {isCall} />
			{:else}
				<DemoCallInfo {isCall} />
			{/if}
			<CallScreen
				{isCall}
				{activateCall}
				{buttonText}
				{isEmergency}
				{isMicrophone}
				{isSpeaker}
				{activateMic}
				{activateSpeaker}
			/>
		</div>
	{/snippet}
</Modal>
