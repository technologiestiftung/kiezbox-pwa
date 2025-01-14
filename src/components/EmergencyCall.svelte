<script lang="ts">
	import { Web } from 'sip.js';

	// State
	let timer: string = $state('00:00:00');
	let timerInterval: number | undefined = $state(undefined);
	let isConnected = $state(false);
	let isInCall = $state(false);

	// Configuration
	const webSocketServer = 'wss://edge.sip.onsip.com';
	const target = 'sip:echo@sipjs.onsip.com';
	const displayName = 'Kiezbox Demo';

	let audioElement: HTMLAudioElement;

	const simpleUserDelegate = {
		onCallCreated: (): void => {
			console.log(`Call created`);
		},
		onCallAnswered: (): void => {
			console.log(`Call answered`);
			// display timer for the call duration
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

	function getSimpleUserOptions() {
		if (audioElement) {
			return {
				delegate: simpleUserDelegate,
				media: {
					remote: {
						audio: audioElement
					}
				},
				userAgentOptions: {
					// logLevel: "debug",
					displayName
				}
			};
		}
	}

	// Construct a SimpleUser instance
	// todo: everything has to be dependent on the audioElement, but the audioElement is not available yet, how can I fix this issue?
	const simpleUser = new Web.SimpleUser(webSocketServer, getSimpleUserOptions());

	// Options are not working, because the audioElement is not available yet
	console.log('[EmergencyCall] simpleUserOptions::', getSimpleUserOptions());

	// fix: this function can only run, of the component is mounted
	function connect() {
		if (audioElement && simpleUser) {
			console.log('[EmergencyCall] getSimpleUserOptions()::', getSimpleUserOptions());

			simpleUser.delegate = simpleUserDelegate;

			simpleUser
				.connect()
				.then(() => {
					console.log(`[${simpleUser.id}] connected`);
					isConnected = true;
					// connectButton.disabled = true;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser.id}] failed to connect`);
					console.error(error);
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
					console.log(`[${simpleUser.id}] placed call`);
					isInCall = true;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser.id}] failed to place call`);
					console.error(error);
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
					console.log(`[${simpleUser.id}] disconnected`);

					clearTimeout(timerInterval);
					isConnected = false;
					isInCall = false;
				})
				.catch((error: Error) => {
					console.error(`[${simpleUser.id}] failed to disconnect`);
					console.error(error);
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
	<audio bind:this={audioElement} id="audioElement" controls>
		<p>Your browser doesn't support HTML5 audio.</p>
	</audio>

	{#if !isConnected}
		<span>is Not Connected</span>
		<button onclick={connect}>Verbinden</button>
	{/if}

	{#if isConnected && !isInCall}
		<span>is Connected</span>
		<button onclick={makeCall}>Anrufen</button>
	{/if}

	{#if isInCall}
		<!-- <p id="timer">{timer}</p> -->
		<span>is In Call</span>
		<button onclick={hangup}>Auflegen</button>
	{/if}
</div>

<style>
	.emergencyCall-root {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		background-color: #0263d3;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
