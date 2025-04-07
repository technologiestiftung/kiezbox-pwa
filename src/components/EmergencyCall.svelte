<script lang="ts">
	import { browser } from '$app/environment';
	import {
		PUBLIC_KB_DISPLAY_NAME,
		PUBLIC_KB_DOMAIN,
		PUBLIC_KB_SERVER_ADDRESS,
		PUBLIC_KB_SIP_PASSWORD,
		PUBLIC_KB_SIP_USERNAME,
		PUBLIC_KB_TARGET_URI,
		PUBLIC_KB_WSS_PATH,
		PUBLIC_KB_WSS_PORT
	} from '$env/static/public';
	import { t } from '$lib/translations';
	import { createCallService, type CallServiceApi } from '$lib/utils/callService';
	import { CallState, type CallServiceState, type KiezboxConfig } from '$lib/utils/callUtils';
	import { RegistererState } from 'sip.js';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import CallScreen from './EmergencyCall/CallScreen.svelte';
	import DemoCallInfo from './EmergencyCall/DemoCallInfo.svelte';
	import Dialer from './EmergencyCall/Dialer.svelte';
	import EmergencyCallInfo from './EmergencyCall/EmergencyCallInfo.svelte';
	import Modal from './Modal.svelte';

	let isEmergency = $state(true);
	let isModal = $state(false);

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	let callServiceApi = $state<CallServiceApi | null>(null);
	let callServiceState = $state<CallServiceState | null>(null);
	let unsubscribeState: (() => void) | null = null;

	// Non-reactive flag to prevent re-initialization
	let initialized = false;

	// states
	const callState = $derived(callServiceState?.callState ?? false);
	const registererState = $derived(callServiceState?.registererState ?? false);

	const time = $derived(callServiceState?.callDuration ?? 0);
	const isMicrophoneMuted = $derived(callServiceState?.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(callServiceState?.isSpeakerMuted ?? false);
	const errorMessage = $derived(callServiceState?.errorMessage ?? null);

	// elements
	const kiezboxConfig: KiezboxConfig = {
		kbServerAddress: PUBLIC_KB_SERVER_ADDRESS,
		kbWSSPort: Number(PUBLIC_KB_WSS_PORT),
		kbWSSPath: PUBLIC_KB_WSS_PATH,
		kbDomain: PUBLIC_KB_DOMAIN,
		kbSIPUsername: PUBLIC_KB_SIP_USERNAME,
		kbSIPPassword: PUBLIC_KB_SIP_PASSWORD,
		kbDisplayName: PUBLIC_KB_DISPLAY_NAME,
		kbTargetUri: PUBLIC_KB_TARGET_URI
	};

	const initialize = async () => {
		try {
			if (!browser) {
				throw new Error('Browser not supported');
			}

			if (!remoteAudio) {
				throw new Error('Remote audio element not defined');
			}

			if (callServiceApi && initialized) {
				console.log('[$effect] CallService API already initialized');
				return;
			}

			console.log('[$effect] Initializing CallService API...');
			initialized = true;

			const serviceApi = createCallService(kiezboxConfig);
			serviceApi.setAudioElement(remoteAudio); // Pass the audio element

			unsubscribeState = serviceApi.state.subscribe((newState) => {
				callServiceState = newState;
			});

			callServiceApi = serviceApi;
		} catch (error: unknown) {
			if (error instanceof Error) {
				toast.error('Failed to initialize CallService API: ' + error.message);
			} else {
				toast.error('Failed to initialize CallService API: ' + String(error));
			}
		}
	};

	onDestroy(() => {
		console.log('[onDestroy] Disconnecting CallService API...');
		if (unsubscribeState) {
			unsubscribeState();
			unsubscribeState = null;
		}

		if (callServiceApi) {
			callServiceApi.disconnect().finally(() => {
				callServiceApi = null;
				callServiceState = null;
				initialized = false;
			});
		}
	});

	const openCaller = async () => {
		isModal = true;
		await initialize();
	};

	const closeCaller = async () => {
		console.log('[$effect] Closing caller modal');
		console.log('[$effect] Call dis:', isCloseDisabled());

		if (isCloseDisabled()) return;

		if (
			callServiceApi &&
			(callState === CallState.CALLING || callState === CallState.CALL_ESTABLISHED)
		) {
			await callServiceApi.hangupOrReject();
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
		if (!callServiceApi) return;

		if (registererState !== RegistererState.Registered) {
			console.warn('Not registered, attempting to connect...');
			await callServiceApi.createUserAgent();

			try {
				await waitForRegistration();
				console.log('Successfully registered.');
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error('Registration failed:', error.message);
				} else {
					console.error('Registration failed:', error);
				}
				return;
			}
		}

		console.log('[$effect] Call action triggered');
		console.log('[$effect] Call state:', callState);
		console.log('[$effect] Registerer state:', registererState);

		if (callState === CallState.CALL_INCOMING) {
			await callServiceApi.answerCall();
		} else if (callState === CallState.CALL_ESTABLISHED || callState === CallState.CALLING) {
			await callServiceApi.hangupOrReject();
		} else if (registererState === RegistererState.Registered) {
			const targetUri = `${kiezboxConfig.kbTargetUri}`;
			await callServiceApi.makeCall(targetUri);
		} else {
			console.warn('Not registered, attempting to connect...');
			await callServiceApi.createUserAgent();
		}
	};

	const activateMic = () => {
		callServiceApi?.toggleMicrophoneMute(); // Use API object
	};

	const activateSpeaker = () => {
		callServiceApi?.toggleSpeakerMute(); // Use API object
	};

	const changeState = () => {
		isEmergency = !isEmergency;
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
				return $t('content.emergency_phone.call');
		}
	};

	const statusText = $derived(status(callState));

	// Determine button text and disabled states based on service state
	const callButtonText = $derived(buttonText(callState));

	$effect(() => {
		if (!callState || !initialized) return;
		toast.success(statusText);
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
<Dialer {isEmergency} onClick={openCaller}></Dialer>
<Modal close={closeCaller} {isModal} disabled={isCloseDisabled()}>
	{#snippet children()}
		<div class="EmergencyCall-root relative flex h-full w-full flex-col justify-between">
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
