<script lang="ts">
	import Dialer from './EmergencyCall/Dialer.svelte';
	import Modal from './Modal.svelte';
	import DemoCallInfo from './EmergencyCall/DemoCallInfo.svelte';
	import EmergencyCallInfo from './EmergencyCall/EmergencyCallInfo.svelte';
	import { t } from '$lib/translations';
	import CallScreen from './EmergencyCall/CallScreen.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Ack,
		Cancel,
		Invitation,
		Inviter,
		Registerer,
		RegistererState,
		Session,
		SessionState,
		UserAgent,
		Web,
		type InviterOptions,
		type SessionDelegate,
		type UserAgentDelegate
	} from 'sip.js';
	import {
		createUserAgent,
		createInviter,
		stopUserAgent,
		terminateSession
	} from '$lib/utils/userAgentService';
	import type { KiezboxConfig } from '$lib/utils/callService';
	import type { IncomingRequestMessage } from 'sip.js/lib/core';

	let isEmergency = $state(true);
	let isMicrophoneMuted = $state(false);
	let isSpeakerMuted = $state(false);

	let isConnected = $state(false);
	let isInCall = $state(false);
	let time = $state(0);
	let simpleUser: Web.SimpleUser | undefined = $state(undefined);
	let userAgent: UserAgent | undefined = $state(undefined);
	let timerInterval: number | undefined = $state(undefined);

	let invitation: Invitation | undefined = $state(undefined);

	let activeSession: Inviter | Session | undefined = $state(undefined);

	let isModal = $state(false);
	let registerer: Registerer | undefined = $state(undefined);
	let isRegistered = $state(false);

	// Elements
	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	const kiezboxConfig: KiezboxConfig = {
		kbServerAddress: 'emergency.ds-apps.tsb-berlin.de',
		kbWSSPort: 8089,
		kbWSSPath: '/ws',
		kbDomain: 'emergency.ds-apps.tsb-berlin.de',
		kbSIPUsername: 'User1',
		kbSIPPassword: '1234', // Replace with actual password
		kbisplayName: 'Kiezbox Emergency'
	};

	const simpleUserDelegate = {
		onCallCreated: (): void => {
			console.log(`Call created`);
		},
		onCallAnswered: (): void => {
			console.log(`Call answered`);

			const callStarted = new Date();
			const updateTimer = () => {
				time = new Date().getTime() - callStarted.getTime();
				timerInterval = setTimeout(updateTimer, 1000);
			};
			updateTimer();
		},
		onCallHangup: (): void => {
			console.log(`Call hangup`);
		},
		onCallHold: (held: boolean): void => {
			console.log(`Call hold`);
		}
	};

	const openCaller = () => {
		isModal = true;
	};

	const closeCaller = async () => {
		await hangup();
		isModal = false;
	};

	const activateCall = () => {
		isInCall = !isInCall;
		if (!isInCall) {
			time = 0;
			hangup();
		} else {
			makeCall();
		}
	};

	const register = async () => {
		if (!userAgent) {
			console.error('Cannot register, UserAgent not available.');
			return;
		}
		if (registerer) {
			console.log('Already have a registerer, potentially already registered or registering.');
			// Optionally unregister first if needed: await registerer.unregister();
		}
		try {
			console.log('Registering...');
			registerer = new Registerer(userAgent);
			registerer.stateChange.addListener((newState) => {
				console.log(`[App] Registration state changed to ${newState}`);
				isRegistered = newState === RegistererState.Registered;
				if (!isRegistered) {
					// Handle registration failure/unregistration
					console.log('Registration failed or unregistered.');
				} else {
					// Handle successful registration
					console.log('Successfully registered.');
				}
			});
			await registerer.register();
			console.log('Registration attempt sent.');
		} catch (e) {
			console.error('Registration failed', e);
			isRegistered = false;
		}
	};

	const delegate: UserAgentDelegate = {
		onConnect: () => {
			console.log('UserAgent Connected!');
			// Maybe enable UI elements now
			register();
		},
		onDisconnect: (error?: Error) => {
			console.log('UserAgent Disconnected.', error);
			// Disable UI, handle
		},
		onInvite: (_invitation: Invitation) => {
			console.log('[App] Incoming INVITE received:', _invitation);
			// --- THIS IS THE KEY PART ---
			// 1. Store the invitation object so you can act on it later
			invitation = _invitation;

			console.log('[App] Incoming call from:', invitation.remoteIdentity.uri.toString());

			invitation.delegate = {
				onCancel: (cancel: Cancel) => {
					console.log('[App] Invitation was cancelled by caller');
					invitation = undefined;
				}
				// Add other delegate methods as needed (onReject, etc.)
			};
		}
		// ... other delegate methods like onMessage, onNotify, etc.
	};

	const sessionDelegate: SessionDelegate = {
		onAck: (ack: Ack) => {
			// Received ACK from remote party
			console.log('[App] Call ACK received:', ack);
			// This is where you can start the call timer, etc.
			// startTimer();
		},
		// onAck: (request) => { // onStateChange(Established) is usually sufficient
		//  console.log('[App] Call ACK received:', request);
		// },
		onBye: (request) => {
			// Received BYE from remote party
			console.log('[App] Received BYE request. Session will terminate.');
			// SIP.js handles sending the 200 OK automatically.
			// onStateChange(Terminated) will follow.
			activeSession = undefined; // Clear session proactively
		}
		// Add other handlers like onRefer, onNotify if needed
	};

	const connect = async () => {
		try {
			if (!remoteAudio) throw new Error('Audio is not available');
			if (isEmergency) {
				userAgent = await createUserAgent(kiezboxConfig, delegate);
			} else {
				//simpleUser = await createSimpleUser(simpleUserDelegate, remoteAudio, demoConfig);
			}
		} catch (error) {
			console.error(`[${userAgent}] failed to connect.\n` + error);
			alert('Failed to connect.\n' + error);
		} finally {
			isConnected = true;
		}
	};

	const makeCall = async () => {
		try {
			await connect();
			if (isEmergency) {
				if (!userAgent) throw new Error('UserAgent is not available');
				//const kbURI = `sip:User2@${kiezboxConfig.kbDomain}`;
				const kbURI = `sip:200@kb-t-71-01`;
				activeSession = (await createInviter(userAgent, kbURI, sessionDelegate)) as Inviter;

				console.log(`[App] Placing call to ${kbURI}`);
				console.log(`[App] Call session created:`, activeSession);

				activeSession.invite();
				activeSession.stateChange.addListener((newState) => {
					console.log(`[App] Call state changed to ${newState}`);
					if (newState === SessionState.Established) {
						// Call is established
						console.log('Call established');
					} else if (newState === SessionState.Terminated) {
						// Call is terminated
						console.log('Call terminated');
						activeSession = undefined; // Clear session proactively
					}
				});
			} else {
				if (!simpleUser) throw new Error('SimpleUser is not available');
			}
		} catch (error) {
			console.error(`[${userAgent}] failed to place call.\n` + error);
			alert('Failed to place call.\n' + error);
		} finally {
			isInCall = true;
		}
	};

	const hangup = async () => {
		try {
			if (isEmergency) {
				if (!userAgent) throw new Error('UserAgent is not available');
				await stopUserAgent(userAgent);
			} else {
				if (!simpleUser) throw new Error('SimpleUser is not available');
			}
		} catch (error) {
			console.error(`[${userAgent}] failed to disconnect.\n` + error);
			alert('Failed to disconnect.\n' + error);
		} finally {
			clearTimeout(timerInterval);
			isConnected = false;
			isInCall = false;
		}
	};

	const buttonText = $derived(
		isEmergency
			? !isInCall
				? $t('content.emergency_phone.emergency.offline.call_button')
				: $t('content.emergency_phone.emergency.online.call_button')
			: !isInCall
				? $t('content.emergency_phone.default.offline.call_button')
				: $t('content.emergency_phone.default.online.call_button')
	);

	const activateMic = () => {
		isMicrophoneMuted = !isMicrophoneMuted;
	};
	const activateSpeaker = () => {
		isSpeakerMuted = !isSpeakerMuted;
	};

	const changeState = () => {
		isEmergency = !isEmergency;
	};
</script>

<Button variant="default" class="w-32" on:click={() => changeState()}>
	{isEmergency
		? $t('content.emergency_phone.emergency.offline.call_button')
		: $t('content.emergency_phone.default.offline.call_button')}
</Button>
<Dialer {isEmergency} onClick={openCaller}></Dialer>

<Modal close={closeCaller} {isModal}>
	{#snippet children()}
		<div class="EmergencyCall-root flex w-full flex-grow flex-col justify-between space-y-8 py-6">
			<div class="flex flex-col space-y-8">
				{#if isEmergency}
					<EmergencyCallInfo {isInCall} />
				{:else}
					<DemoCallInfo {isInCall} />
				{/if}
			</div>

			<CallScreen
				{isInCall}
				{activateCall}
				{buttonText}
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
