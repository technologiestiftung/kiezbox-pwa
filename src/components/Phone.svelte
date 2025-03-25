<script lang="ts">
	import PhoneMenu from './PhoneMenu.svelte';
	import Modal from './Modal.svelte';
	import DemoCallInfo from './DemoCallInfo.svelte';
	import EmergencyCallInfo from './EmergencyCallInfo.svelte';
	import { t } from '$lib/translations';
	import CallerScreen from './CallerScreen.svelte';
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

<PhoneMenu {isEmergency} onClick={triggerInitCall}></PhoneMenu>
<Modal bind:showModal>
	{#snippet children()}
		<div class="phone-root mp-8 flex flex-grow flex-col justify-between space-y-8 py-6">
			{#if isEmergency}
				<DemoCallInfo {isCall} />
			{:else}
				<EmergencyCallInfo {isCall} />
			{/if}
			<CallerScreen
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
