<script lang="ts">
	import { PUBLIC_KB_DEMO_TARGET_URI, PUBLIC_KB_TARGET_URI } from '$env/static/public';
	import { apiFetch } from '$lib/api';
	import { t } from '$lib/translations';
	import { RegistererState } from 'sip.js';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import CallScreen from './CallScreen.svelte';
	import DemoCallInfo from './DemoCallInfo.svelte';
	import Dialer from './Dialer.svelte';
	import EmergencyCallInfo from './EmergencyCallInfo.svelte';
	import Modal from '../Modal.svelte';
	import DialerError from './DialerError.svelte';
	import {
		initCallService,
		cleanupCallService,
		CallStore,
		createUserAgent
	} from '$lib/state/callState.svelte';
	import { ApiStatus, CallState } from '$lib/enums';
	import { NetworkStore } from '$lib/state/networkState.svelte';

	let isModal = $state(false);

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);
	let SIPConfig = $state<any | null>(null);

	// Access the singleton state
	const callState = $derived(CallStore.state?.callState ?? false);
	const registererState = $derived(CallStore.state?.registererState ?? false);

	let user = $state<SIPUser | null>(null);

	// Mode from network state
	let isEmergency = $derived(false); // Replace with actual emergency state

	// Call state properties
	const time = $derived(CallStore.state?.callDuration ?? 0);
	const isMicrophoneMuted = $derived(CallStore.state?.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(CallStore.state?.isSpeakerMuted ?? false);
	const errorMessage = $derived(CallStore.state?.errorMessage ?? null);

	const initialize = async () => {
		try {
			if (!remoteAudio) {
				throw new Error('Remote audio element not defined');
			}

			// First fetch the SIP config if needed
			if (!SIPConfig) {
				try {
					SIPConfig = await apiFetch('/api/sipconfig');
					if (!SIPConfig) throw new Error('Empty SIP config');
				} catch (error) {
					throw new Error(`Failed to fetch SIP config: ${error}`);
				}
			}

			// Fetch session for SIP authentication
			let session: any;
			try {
				session = (await apiFetch('/api/session')) as any;
				if (!session) throw new Error('Empty session from GET');
			} catch {
				session = (await apiFetch('/api/session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				})) as any;
				if (!session) throw new Error('Empty session from POST');
			}

			user = {
				username: SIPConfig.kbUserPrefix + session.extension.toString().padStart(4, '0'),
				password: session.password,
				timestamp: session.timestamp,
				displayName: session.extension
			};

			// Initialize the call service singleton
			await initCallService(SIPConfig, remoteAudio);

			// Create the user agent for SIP communication
			await createUserAgent(user);
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

	const openCaller = async () => {
		isModal = true;
	};

	const closeCaller = async () => {
		if (isCloseDisabled()) return;

		if (
			CallStore.instance &&
			(callState === CallState.CALLING || callState === CallState.CALL_ESTABLISHED)
		) {
			await CallStore.instance.hangupOrReject();
		}
		isModal = false;
	};

	const waitForRegistration = async (timeoutMs = 10000) => {
		const start = Date.now();
		return new Promise<void>((resolve, reject) => {
			let checkInterval: ReturnType<typeof setInterval>;
			let cleanup = () => clearInterval(checkInterval);

			checkInterval = setInterval(() => {
				if (registererState === RegistererState.Registered) {
					cleanup();
					resolve();
				} else if (Date.now() - start > timeoutMs) {
					cleanup();
					reject(new Error('Registration timed out.'));
				}
			}, 100);

			setTimeout(() => {
				cleanup();
				reject(new Error('Registration timed out.'));
			}, timeoutMs + 100);
		});
	};

	const handleCallAction = async () => {
		if (callState === CallState.CALL_ESTABLISHED || callState === CallState.CALLING) {
			if (CallStore.instance) {
				await CallStore.instance.hangupOrReject();
			}
			return;
		}
		if (callState === CallState.CALL_TERMINATING) {
			toast.info('Call is terminating, please wait...');
			return;
		}

		if (!CallStore.instance) {
			await initialize();
			if (!CallStore.instance) return;
		}

		if (callState === CallState.CALL_INCOMING) {
			await CallStore.instance.answerCall();
			return;
		}

		if (registererState !== RegistererState.Registered) {
			console.warn('Not registered, attempting to connect...');
			await createUserAgent(user);

			try {
				await waitForRegistration();
			} catch (error: unknown) {
				toast.error(String(error));
				return;
			}
		}

		if (registererState === RegistererState.Registered) {
			const targetUri = `${isEmergency ? PUBLIC_KB_TARGET_URI : PUBLIC_KB_DEMO_TARGET_URI}`;
			await CallStore.instance.makeCall(targetUri);
		}
	};

	const activateMic = () => {
		CallStore.instance?.toggleMicrophoneMute();
	};

	const activateSpeaker = () => {
		CallStore.instance?.toggleSpeakerMute();
	};

	const changeState = () => {
		console.log('Mode changed to:', isEmergency ? 'Emergency' : 'Demo');
	};

	const status = (callState: CallState | false) => {
		switch (callState) {
			case CallState.CALL_ESTABLISHED:
				return $t('common.status.call_established');
			case CallState.CALLING:
				return $t('common.status.calling');
			case CallState.CALL_FAILED:
				return $t('common.status.call_failed');
			case CallState.CALL_REJECTED:
				return $t('common.status.call_rejected');
			case CallState.CALL_TERMINATED:
				return $t('common.status.call_terminated');
			case CallState.CONNECTED:
				return $t('common.status.connected');
			case CallState.INITIALIZED:
				return $t('common.status.online');
			default:
				return $t('common.status.online');
		}
	};

	const onDone = () => {
		NetworkStore.networkServiceInstance?.setMeFree();
		window.location.reload();
	};

	const isCloseDisabled = $derived(() => {
		if (callState === CallState.CALL_ESTABLISHED) return true;
		if (callState === CallState.CALLING) return true;
		if (callState === CallState.CALL_INCOMING) return true;
		if (callState === CallState.CALL_REDIRECTED) return true;
		return false;
	});

	const buttonText = (callState: CallState | false) => {
		switch (callState) {
			case CallState.CALL_ESTABLISHED:
				return $t('content.emergency_phone.active');
			case CallState.CALLING:
				return $t('content.emergency_phone.calling');
			case CallState.CALL_FAILED:
				return $t('content.emergency_phone.failed');
			case CallState.CALL_INCOMING:
				return $t('content.emergency_phone.incoming');
			default:
				return isEmergency
					? $t('content.emergency_phone.call')
					: $t('content.emergency_phone.callDemo');
		}
	};

	const statusText = $derived(status(callState));
	const callButtonText = $derived(buttonText(callState));

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

{#if NetworkStore.networkState?.apiStatus !== ApiStatus.AVAILABLE && NetworkStore.networkState?.errorMessage}
	<DialerError errorMessage={NetworkStore.networkState?.errorMessage} onClick={onDone} />
{:else}
	<Dialer {isEmergency} onClick={openCaller}></Dialer>
{/if}

<Modal close={closeCaller} {isModal} disabled={isCloseDisabled()}>
	{#snippet children()}
		<div class="EmergencyCall-root relative flex w-full flex-grow flex-col justify-between">
			{#if isEmergency}
				<EmergencyCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
			{:else}
				<DemoCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
			{/if}

			<CallScreen
				isInCall={callState === CallState.CALL_ESTABLISHED}
				activateCall={handleCallAction}
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
