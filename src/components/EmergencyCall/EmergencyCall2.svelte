<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Web } from 'sip.js';
	import { onMount } from 'svelte';

	// State
	let timer: string = $state('00:00:00');
	let timerInterval: number | undefined = $state(undefined);
	let isConnected = $state(false);
	let isInCall = $state(false);
	let simpleUser: Web.SimpleUser | undefined = $state(undefined);

	// Configuration
	const webSocketServer = 'wss://edge.sip.onsip.com';
	const target = 'sip:echo@sipjs.onsip.com';
	const displayName = 'Kiezbox Demo';

	// Elements
	let remoteAudio: HTMLAudioElement;

	const simpleUserDelegate = {
		onCallCreated: (): void => {
			console.log(`Call created`);
		},
		onCallAnswered: (): void => {
			console.log(`Call answered`);

			const callStarted = new Date();
			const updateTimer = () => {
				const callDuration = new Date().getTime() - callStarted.getTime();
				const hours = Math.floor(callDuration / 3600000);
				const minutes = Math.floor((callDuration % 3600000) / 60000);
				const seconds = Math.floor((callDuration % 60000) / 1000);
				timer = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
				console.log('[EmergencyCall] timer::', timer);

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

	onMount(() => {
		simpleUser = new Web.SimpleUser(webSocketServer, {
			delegate: simpleUserDelegate,
			media: {
				remote: {
					audio: remoteAudio
				}
			},
			userAgentOptions: {
				displayName
			}
		});
	});

	function connect() {
		if (remoteAudio && simpleUser) {
			simpleUser
				.connect()
				.then(() => {
					console.log(`[${simpleUser?.id}] connected`);
					isConnected = true;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser?.id}] failed to connect.\n` + error);
					alert('Failed to connect.\n' + error);
				});
		} else {
			console.warn('User is not available');
		}
	}

	function makeCall() {
		if (simpleUser) {
			simpleUser
				.call(target, {
					inviteWithoutSdp: false
				})
				.then(() => {
					console.log(`[${simpleUser?.id}] placed call`);
					isInCall = true;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser?.id}] failed to place call.\n` + error);
					alert('Failed to place call.\n' + error);
				});
		} else {
			console.warn('User is not available');
		}
	}

	function hangup() {
		if (simpleUser) {
			simpleUser
				.disconnect()
				.then(() => {
					console.log(`[${simpleUser?.id}] disconnected`);

					clearTimeout(timerInterval);
					isConnected = false;
					isInCall = false;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser?.id}] failed to disconnect.\n` + error);
					alert('Failed to disconnect.\n' + error);
				});
		} else {
			console.warn('User is not available');
		}
	}
</script>

<div class="emergencyCall-root">
	<p>
		When the call is established, the remote audio is added to the following HTML5 audio element...
	</p>
	<audio bind:this={remoteAudio} id="audioElement" controls>
		<p>Your browser doesn't support HTML5 audio.</p>
	</audio>
	<p id="timer">{timer}</p>

	{#if !isConnected}
		<span>is Not Connected</span>
		<Button onclick={connect}>Verbinden</Button>
	{/if}

	{#if isConnected && !isInCall}
		<span>is Connected</span>
		<Button onclick={makeCall}>Anrufen</Button>
	{/if}

	{#if isInCall}
		<span>is In Call</span>
		<Button onclick={hangup}>Auflegen</Button>
	{/if}
</div>

<style>
	.emergencyCall-root {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
