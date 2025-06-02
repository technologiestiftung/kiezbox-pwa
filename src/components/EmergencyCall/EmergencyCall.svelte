<script lang="ts">
	import { PUBLIC_KB_DEMO_TARGET_URI, PUBLIC_KB_TARGET_URI } from '$env/static/public';
	import { t } from '$lib/translations';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import CallScreen from './CallScreen.svelte';
	import DemoCallInfo from './DemoCallInfo.svelte';
	import Dialer from './Dialer.svelte';
	import EmergencyCallInfo from './EmergencyCallInfo.svelte';
	import Modal from '../Modal.svelte';
	import DialerError from './DialerError.svelte';
	import {
		cleanupCallService,
		CallStore,
		toggleMicrophoneMute,
		toggleSpeakerMute,
		setAudioElement,
		initializeCallService,
		handleCallAction,
		getCallStatus,
		getCallButtonText,
		isCloseDisabled as getIsCloseDisabled
	} from '$lib/state/callState.svelte';
	import { ApiStatus, CallState } from '$lib/enums';
	import { NetworkStore, setMeFree } from '$lib/state/networkState.svelte';

	let isModal = $state(false);

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	// Access the singleton state directly
	const callState = $derived(CallStore.callState ?? CallState.INITIALIZED);

	let isEmergency = $derived(false); // Replace with actual emergency state

	// Call state properties
	const time = $derived(CallStore.callDuration ?? 0);
	const isMicrophoneMuted = $derived(CallStore.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(CallStore.isSpeakerMuted ?? false);
	const errorMessage = $derived(CallStore.errorMessage ?? null);

	const initialize = async () => {
		try {
			if (!remoteAudio) {
				throw new Error('Remote audio element not defined');
			}
			// Initialize everything in one go
			await initializeCallService(remoteAudio);
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message.includes('API') || error.message.includes('fetch')) {
					toast.error($t('common.status.invalid_network'));
				} else {
					toast.error(error.message);
				}
			} else {
				toast.error(String(error));
			}
		}
	};

	onDestroy(async () => {
		// Clean up the call service when component is destroyed
		await cleanupCallService();
	});

	$effect(() => {
		// When remoteAudio is set, update the audio element in the store
		if (remoteAudio) {
			setAudioElement(remoteAudio);
		}
	});

	const openCaller = async () => {
		initialize();
		isModal = true;
	};

	const closeCaller = async () => {
		if (isCloseDisabled) return;

		if (callState === CallState.CALLING || callState === CallState.CALL_ESTABLISHED) {
			await handleCallAction('', undefined, (error) => toast.error(error));
		}
		isModal = false;
	};

	// Removed waitForRegistration as it's now in the store

	const call = async () => {
		const targetUri = `${isEmergency ? PUBLIC_KB_TARGET_URI : PUBLIC_KB_DEMO_TARGET_URI}`;
		await handleCallAction(targetUri, remoteAudio, (error) => toast.error(error));
	};

	const activateMic = () => {
		toggleMicrophoneMute();
	};

	const activateSpeaker = () => {
		toggleSpeakerMute();
	};

	const changeState = () => {
		console.log('Mode changed to:', isEmergency ? 'Emergency' : 'Demo');
	};

	// Using the store's getCallStatus function instead

	const onDone = () => {
		setMeFree();
		window.location.reload();
	};

	const isCloseDisabled = $derived(getIsCloseDisabled());

	// Using the store's getCallButtonText function instead

	const statusText = $derived(getCallStatus($t));
	const callButtonText = $derived(getCallButtonText(isEmergency, $t));

	$effect(() => {
		if (!callState) return;
		toast.success(statusText);
	});

	$effect(() => {
		if (!errorMessage) return;
		toast.error(errorMessage);
	});

	const handleKeydown = (event: KeyboardEvent) => {
		// Check for Ctrl+Shift+E to toggle emergency mode
		if (event.ctrlKey && event.shiftKey && event.key === 'E') {
			event.preventDefault();
			changeState();
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<button
	class="fixed right-0 bottom-0 size-24 cursor-default opacity-0"
	onclick={() => {
		changeState();
		toast.success(isEmergency ? 'Switched to Emergency Mode' : 'Switched to Demo Mode');
	}}
	aria-hidden="true"
>
	<span class="sr-only">Toggle emergency mode</span>
</button>

<!-- {#if NetworkStore.networkState?.apiStatus !== ApiStatus.AVAILABLE && NetworkStore.networkState?.errorMessage}
	<DialerError errorMessage={NetworkStore.networkState?.errorMessage} onClick={onDone} />
{:else} -->
<Dialer {isEmergency} onClick={openCaller}></Dialer>
<!-- {/if} -->

<Modal close={closeCaller} {isModal} disabled={isCloseDisabled}>
	{#snippet children()}
		<div class="EmergencyCall-root relative flex w-full flex-grow flex-col justify-between">
			{#if isEmergency}
				<EmergencyCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
			{:else}
				<DemoCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
			{/if}

			<CallScreen
				isInCall={callState === CallState.CALL_ESTABLISHED}
				activateCall={call}
				buttonText={callButtonText}
				{isEmergency}
				{activateMic}
				{activateSpeaker}
				{time}
				{isMicrophoneMuted}
				{isSpeakerMuted}
				canCall={true}
				{errorMessage}
				bind:remoteAudio
			/>
		</div>
	{/snippet}
</Modal>
