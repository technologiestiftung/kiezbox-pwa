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
	import { NetworkStore, setMeFree, toggleMode } from '$lib/state/networkState.svelte';

	let isModal = $state(false);

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	// Access the singleton state directly
	const callState = $derived(CallStore.callState ?? CallState.INITIALIZED);

	let isEmergency = $derived(NetworkStore.mode?.isEmergency); // Replace with actual emergency state

	// Call state properties
	const time = $derived(CallStore.callDuration ?? 0);
	const isMicrophoneMuted = $derived(CallStore.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(CallStore.isSpeakerMuted ?? false);
	const errorMessage = $derived(CallStore.errorMessage ?? null);
	const showDialer = $derived(
		NetworkStore?.apiStatus === ApiStatus.AVAILABLE && !NetworkStore?.errorMessage
	);
	let debounceTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
	const isAdmin = $derived(NetworkStore.adminMode ?? false);

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
		await cleanupCallService();
	});

	$effect(() => {
		return () => {
			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}
		};
	});

	$effect(() => {
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

	const onDone = () => {
		setMeFree();
		window.location.reload();
	};

	const isCloseDisabled = $derived(getIsCloseDisabled());

	const statusText = $derived(getCallStatus($t));
	const callButtonText = $derived(getCallButtonText(isEmergency, $t));

	$effect(() => {
		if (!callState || !statusText) return;
		toast.success(statusText);
	});

	$effect(() => {
		if (!errorMessage) return;
		toast.error(errorMessage);
	});

	$inspect(showDialer);
</script>

{#if isAdmin}
	<button
		onclick={() => toggleMode()}
		class="EmergencyCall-admin-button text-purple-dark py-2 font-bold"
	>
		TOGGLE MODE</button
	>
{/if}
{#if !showDialer}
	<DialerError errorMessage={NetworkStore.errorMessage} onClick={onDone} />
{/if}
<div class={showDialer ? 'block' : 'hidden'}>
	<Dialer {isEmergency} onClick={openCaller}></Dialer>
</div>

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
