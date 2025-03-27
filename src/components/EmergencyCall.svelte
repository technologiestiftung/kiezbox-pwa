<script lang="ts">
	import Dialer from './EmergencyCall/Dialer.svelte';
	import Modal from './Modal.svelte';
	import DemoCallInfo from './EmergencyCall/DemoCallInfo.svelte';
	import EmergencyCallInfo from './EmergencyCall/EmergencyCallInfo.svelte';
	import { t } from '$lib/translations';
	import CallScreen from './EmergencyCallComponents/CallScreen.svelte';
	import { PUBLIC_WSS_SERVER, PUBLIC_SIP_TARGET } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { UserAgent, Web } from 'sip.js';
	import { createUserAgent } from '$lib/utils/userAgentUtils';
	import { call, createSimpleUser, hangCall } from '$lib/utils/simpleUserUtils';

	let isEmergency = $state(true);
	let isMicrophone = $state(false);
	let isSpeaker = $state(false);

	let isConnected = $state(false);
	let isInCall = $state(false);
	let time = $state(0);
	let simpleUser: Web.SimpleUser | undefined = $state(undefined);
	let userAgent: UserAgent | undefined = $state(undefined);
	let timerInterval: number | undefined = $state(undefined);

	let isModal = $state(false);

	// Elements
	let remoteAudio = $state<HTMLAudioElement | undefined>(undefined);

	// Emergency SIP configuration
	const webSocketServer = PUBLIC_WSS_SERVER;
	const target = PUBLIC_SIP_TARGET;
	const displayName = 'Kiezbox Demo';

	const config = {
		uri: 'sip:luisebr@sip.linphone.org',
		transportOptions: {
			wsServers: ['wss://edge.sip.onsip.com']
		}
		// authorizationUser: '',
		// password: ''
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

	const connect = async () => {
		try {
			if (isEmergency) {
				userAgent = await createUserAgent();
			} else {
				simpleUser = await createSimpleUser(simpleUserDelegate, remoteAudio, displayName);
			}

			// if (!simpleUser && !userAgent) {
			// 	throw new Error('User is not available');
			// }
			// if (!(remoteAudio && simpleUser && !isConnected)) {
			// 	throw new Error('Audio or user is not available');
			// }
			isConnected = true;
		} catch (error) {
			console.error(`[${simpleUser?.id}] failed to connect.\n` + error);
			alert('Failed to connect.\n' + error);
		}
	};

	const makeCall = async () => {
		try {
			await connect();
			if (!simpleUser) {
				throw new Error('User is not available');
			}
			const callO = await call(simpleUser);
			console.log(`[${simpleUser?.id}] placed call`);
			isInCall = true;
		} catch (error) {
			console.error(`[${simpleUser?.id}] failed to place call.\n` + error);
			alert('Failed to place call.\n' + error);
		}
	};

	const hangup = async () => {
		try {
			if (!simpleUser) {
				throw new Error('User is not available');
			}
			await hangCall(simpleUser);
			clearTimeout(timerInterval);
			isConnected = false;
			isInCall = false;
		} catch (error) {
			console.error(`[${simpleUser?.id}] failed to disconnect.\n` + error);
			alert('Failed to disconnect.\n' + error);
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
		isMicrophone = !isMicrophone;
	};
	const activateSpeaker = () => {
		isSpeaker = !isSpeaker;
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
				{isMicrophone}
				{isSpeaker}
				{activateMic}
				{activateSpeaker}
				{time}
				bind:remoteAudio
			/>
		</div>
	{/snippet}
</Modal>
