<script lang="ts">
	import Dialer from './EmergencyCall/Dialer.svelte';
	import Modal from './Modal.svelte';
	import DemoCallInfo from './EmergencyCall/DemoCallInfo.svelte';
	import EmergencyCallInfo from './EmergencyCall/EmergencyCallInfo.svelte';
	import { t } from '$lib/translations';
	import CallScreen from './EmergencyCall/CallScreen.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		CallState,
		createCallService,
		type CallServiceApi,
		type CallServiceState,
		type KiezboxConfig
	} from '$lib/utils/callService';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { RegistererState } from 'sip.js';

	let isEmergency = $state(true);
	let isModal = $state(false);

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	let callServiceApi = $state<CallServiceApi | null>(null);
	let callServiceState = $state<CallServiceState | null>(null); // Store reactive state
	let unsubscribeState: (() => void) | null = null;

	// Non-reactive flag to prevent re-initialization
	let initialized = false;

	// states

	const callState = $derived(callServiceState?.callState ?? false);
	const registererState = $derived(callServiceState?.registererState ?? false);
	const callerId = $derived(callServiceState?.callerId ?? null);

	const time = $derived(callServiceState?.callDuration ?? 0);
	const isMicrophoneMuted = $derived(callServiceState?.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(callServiceState?.isSpeakerMuted ?? false);
	const errorMessage = $derived(callServiceState?.errorMessage ?? null);

	// Elements

	const kiezboxConfig: KiezboxConfig = {
		kbServerAddress: 'emergency.ds-apps.tsb-berlin.de',
		kbWSSPort: 8089,
		kbWSSPath: '/ws',
		kbDomain: 'emergency.ds-apps.tsb-berlin.de',
		kbSIPUsername: 'User1',
		kbSIPPassword: '1234',
		kbisplayName: 'Kiezbox Emergency'
	};

	const initialize = async () => {
		try {
			// Check if the browser supports the required features
			if (!browser) {
				throw new Error('Browser not supported');
			}

			// Check if remoteAudio is defined
			if (!remoteAudio) {
				throw new Error('Remote audio element not defined');
			}

			// Check if the CallService API is already initialized
			if (callServiceApi && initialized) {
				console.log('[$effect] CallService API already initialized');
				return;
			}

			console.log('[$effect] Initializing CallService API...');
			initialized = true; // Mark as initialized to prevent re-runs

			// Call the factory function
			const serviceApi = createCallService(kiezboxConfig);
			serviceApi.setAudioElement(remoteAudio); // Pass the audio element

			// Subscribe to the state store returned by the API
			unsubscribeState = serviceApi.state.subscribe((newState) => {
				callServiceState = newState;
			});

			callServiceApi = serviceApi; // Assign the API object
		} catch (error) {
			console.error('Initialization error:', error);
			return;
		}
	};

	// Clean up on component destruction
	onDestroy(() => {
		console.log('[onDestroy] Disconnecting CallService API...');
		if (unsubscribeState) {
			unsubscribeState();
			unsubscribeState = null;
		}

		// Call disconnect on the stored API object if it exists
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
		await initialize(); // Initialize the service when the modal opens
	};

	const closeCaller = async () => {
		if (
			callServiceApi &&
			(callState === CallState.CALLING || callState === CallState.CALL_ESTABLISHED)
		) {
			// Use the API object
			await callServiceApi.hangupOrReject();
		}
		isModal = false;
	};

	const waitForRegistration = async (timeoutMs = 10000) => {
		const start = Date.now();
		return new Promise<void>((resolve, reject) => {
			let checkInterval: ReturnType<typeof setInterval>;
			let cleanup = () => clearInterval(checkInterval);

			// Use interval to check registration state
			checkInterval = setInterval(() => {
				if (registererState === RegistererState.Registered) {
					cleanup();
					resolve();
				} else if (Date.now() - start > timeoutMs) {
					cleanup();
					reject(new Error('Registration timed out.'));
				}
			}, 100);

			// Ensure cleanup happens if promise is abandoned
			setTimeout(() => {
				cleanup();
				reject(new Error('Registration timed out.'));
			}, timeoutMs + 100);
		});
	};

	const handleCallAction = async () => {
		if (!callServiceApi) return; // Check if API object exists

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

		// Use the API object to call actions
		if (callState === CallState.CALLING) {
			await callServiceApi.answerCall();
		} else if (callState === CallState.CALL_ESTABLISHED) {
			await callServiceApi.hangupOrReject();
		} else if (registererState === RegistererState.Registered) {
			const targetUri = `sip:200@kb-t-71-01`;
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

	// Determine button text and disabled states based on service state
	const callButtonText = $derived(
		isEmergency
			? callState === CallState.CALLING
				? 'Calling...'
				: $t('content.emergency_phone.emergency.offline.call_button')
			: $t('content.emergency_phone.default.offline.call_button')
	);

	$inspect(
		{
			callState,
			time,
			isMicrophoneMuted,
			isSpeakerMuted,
			errorMessage,
			callerId
		},
		{
			name: 'EmergencyCall',
			enabled: true
		}
	);
</script>

<Button variant="default" class="w-32" on:click={() => changeState()}>
	{isEmergency
		? callState === CallState.CALLING
			? 'Calling...'
			: $t('content.emergency_phone.emergency.offline.call_button')
		: $t('content.emergency_phone.default.offline.call_button')}
</Button>
<Dialer {isEmergency} onClick={openCaller}></Dialer>

<Modal close={closeCaller} {isModal}>
	{#snippet children()}
		<div class="EmergencyCall-root flex w-full flex-grow flex-col justify-between space-y-8 py-6">
			<div class="flex flex-col space-y-8">
				{#if isEmergency}
					<EmergencyCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
				{:else}
					<DemoCallInfo isInCall={callState === CallState.CALL_ESTABLISHED} />
				{/if}
			</div>

			<CallScreen
				isInCall={callState === CallState.CALL_ESTABLISHED}
				activateCall={handleCallAction}
				buttonText={callButtonText}
				{isEmergency}
				{activateMic}
				{activateSpeaker}
				{time}
				buttonDisabled={false}
				{isMicrophoneMuted}
				{isSpeakerMuted}
				canCall={true}
				canHangup={true}
				bind:remoteAudio
			/>
		</div>
	{/snippet}
</Modal>
