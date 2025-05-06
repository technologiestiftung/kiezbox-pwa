<script lang="ts">
	import { browser } from '$app/environment';
	import { PUBLIC_KB_DEMO_TARGET_URI, PUBLIC_KB_TARGET_URI } from '$env/static/public';
	import { apiFetch } from '$lib/api';
	import { t } from '$lib/translations';
	import { createCallService, type CallServiceApi } from '$lib/utils/callService';
	import {
		CallState,
		type CallServiceState,
		type KiezboxConfig,
		type Mode
	} from '$lib/utils/callUtils';
	import { RegistererState } from 'sip.js';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import CallScreen from './EmergencyCall/CallScreen.svelte';
	import DemoCallInfo from './EmergencyCall/DemoCallInfo.svelte';
	import Dialer from './EmergencyCall/Dialer.svelte';
	import EmergencyCallInfo from './EmergencyCall/EmergencyCallInfo.svelte';
	import Modal from './Modal.svelte';

	let isModal = $state(false);

	// let mode = getContext<Mode>('mode');
	let mode = $state({
		isEmergency: true
	});

	// Use $state for the context value instead of a writable store
	let kiezboxConfig: KiezboxConfig = $state<KiezboxConfig>({
		kbServerAddress: '',
		kbWSSPort: 0,
		kbWSSPath: '',
		kbDomain: '',
		kbSIPUsername: '',
		kbSIPPassword: '',
		kbDisplayName: '',
		createdAt: new Date(),
		updatedAt: new Date()
	});

	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);
	let callServiceApi = $state<CallServiceApi | null>(null);
	let callServiceState = $state<CallServiceState | null>(null);
	let unsubscribeState: (() => void) | null = null;

	// Non-reactive flag to prevent re-initialization
	let initialized = false;

	// states
	const callState = $derived(callServiceState?.callState ?? false);
	const registererState = $derived(callServiceState?.registererState ?? false);

	let isEmergency = $derived(mode?.isEmergency);
	const time = $derived(callServiceState?.callDuration ?? 0);
	const isMicrophoneMuted = $derived(callServiceState?.isMicrophoneMuted ?? false);
	const isSpeakerMuted = $derived(callServiceState?.isSpeakerMuted ?? false);
	const errorMessage = $derived(callServiceState?.errorMessage ?? null);

	const initialize = async (forceRefresh = false) => {
		try {
			if (!browser) {
				throw new Error('Browser not supported');
			}

			if (!remoteAudio) {
				throw new Error('Remote audio element not defined');
			}

			if (Date.now() - (kiezboxConfig.createdAt?.getTime() ?? 0) > 10000) {
				console.log('[$effect] Kiezbox config is outdated, refreshing...');
				forceRefresh = true;
			} else {
				console.log('[$effect] Kiezbox config is up to date');
			}

			if (!forceRefresh && callServiceApi && initialized) {
				try {
					const response = await apiFetch('/validateSession', {
						method: 'POST',
						body: JSON.stringify(kiezboxConfig),
						headers: {
							'Content-Type': 'application/json'
						},
						signal: AbortSignal.timeout(5000)
					});

					if (typeof response === 'object' && response !== null && 'sessionState' in response) {
						if (!response.sessionState) {
							forceRefresh = true;
							console.log('[$effect] Session state is invalid, refreshing...');
						} else {
							console.log('[$effect] Session state is valid, no refresh needed');
							return;
						}
					} else {
						forceRefresh = true;
						console.log('[$effect] Invalid response format, refreshing...');
					}
				} catch (error) {}

				console.log('[$effect] CallService API already initialized');
				return;
			}

			// If force refresh requested, clean up existing connection
			if (forceRefresh && callServiceApi && initialized) {
				console.log('[$effect] Force refresh requested, disconnecting existing service');
				await callServiceApi.disconnect();
				initialized = false;
			}

			console.log('[$effect] Initializing CallService API...');

			// Fetch the Kiezbox server config from the API
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const session = (await apiFetch('/session')) as any;
			// const session = {
			// 	config: {
			// 		kbDisplayName: PUBLIC_KB_DISPLAY_NAME,
			// 		kbDomain: PUBLIC_KB_DOMAIN,
			// 		kbServerAddress: PUBLIC_KB_SERVER_ADDRESS,
			// 		kbSIPUsername: PUBLIC_KB_SIP_USERNAME,
			// 		kbSIPPassword: PUBLIC_KB_SIP_PASSWORD,
			// 		kbWSSPort: Number(PUBLIC_KB_WSS_PORT),
			// 		kbWSSPath: PUBLIC_KB_WSS_PATH,
			// 		createdAt: new Date(),
			// 		updatedAt: new Date()
			// 	}
			// };
			console.log('[$effect] Kiezbox server config:', session);

			// Update the state variable directly (will update the context)
			kiezboxConfig.kbDisplayName = session.config.kbDisplayName;
			kiezboxConfig.kbDomain = session.config.kbDomain;
			kiezboxConfig.kbServerAddress = session.config.kbServerAddress;
			kiezboxConfig.kbSIPUsername = session.config.kbSIPUsername;
			kiezboxConfig.kbSIPPassword = session.config.kbSIPPassword;
			kiezboxConfig.kbWSSPort = session.config.kbWSSPort;
			kiezboxConfig.kbWSSPath = session.config.kbWSSPath;
			kiezboxConfig.createdAt = session.config.createdAt;
			kiezboxConfig.updatedAt = session.config.updatedAt;

			// Call the factory function
			if (!kiezboxConfig) {
				throw new Error('Kiezbox server config is not defined');
			}

			const serviceApi = createCallService(kiezboxConfig);
			serviceApi.setAudioElement(remoteAudio);

			unsubscribeState = serviceApi.state.subscribe((newState) => {
				callServiceState = newState;
				if (
					newState.errorMessage &&
					(newState.errorMessage.includes('authentication') ||
						newState.errorMessage.includes('registration failed') ||
						newState.errorMessage.includes('forbidden'))
				) {
					console.warn('[$state] Potential config issue detected:', newState.errorMessage);
					forceRefresh = true;
				}
			});

			callServiceApi = serviceApi;
			initialized = true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error(String(error));
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
		await initialize();

		if (!callServiceApi) return;

		if (registererState !== RegistererState.Registered) {
			console.warn('Not registered, attempting to connect...');
			await callServiceApi.createUserAgent();

			try {
				await waitForRegistration();
			} catch (error: unknown) {
				toast.error(String(error));
				return;
			}
		}

		if (callState === CallState.CALL_INCOMING) {
			await callServiceApi.answerCall();
		} else if (callState === CallState.CALL_ESTABLISHED || callState === CallState.CALLING) {
			await callServiceApi.hangupOrReject();
		} else if (registererState === RegistererState.Registered) {
			const targetUri = `${isEmergency ? PUBLIC_KB_TARGET_URI : PUBLIC_KB_DEMO_TARGET_URI}`;
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
				return isEmergency
					? $t('content.emergency_phone.call')
					: $t('content.emergency_phone.callDemo');
		}
	};

	const statusText = $derived(status(callState));

	// Determine button text and disabled states based on service state
	const callButtonText = $derived(buttonText(callState));

	$effect(() => {
		if (!callState || !initialized) return;
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
	$inspect(mode, isEmergency);
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
