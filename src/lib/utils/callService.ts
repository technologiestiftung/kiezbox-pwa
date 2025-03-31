import { writable, get } from 'svelte/store'; // Import writable and get
import { UserAgent, Inviter, Session, Web, Invitation, SessionState } from 'sip.js';
import { SimpleUser, type SimpleUserDelegate } from 'sip.js/lib/platform/web';

// Import UserAgent service and config type
import {
	createUserAgent,
	inviteUserAgent,
	stopUserAgent,
	terminateSession
} from '$lib/utils/userAgentService';

// --- Type Definitions ---
export type CallMode = 'emergency' | 'demo';
export type ConnectionStatus =
	| 'disconnected'
	| 'connecting'
	| 'connected'
	| 'disconnecting'
	| 'failed';
export type CallStatus = 'idle' | 'dialing' | 'active' | 'terminating' | 'failed';

// Config interface for SimpleUser (can be defined here)
export interface DemoConfig {
	demoWSS: string;
	demoDisplayName: string;
	demoTarget: string;
}

export interface KiezboxConfig {
	kbServerAddress: string;
	kbWSSPort: number;
	kbWSSPath: string;
	kbDomain: string;
	kbSIPUsername: string;
	kbSIPPassword: string;
	kbisplayName: string;
}

// --- Reactive State (Svelte Stores) ---
export const connectionStatus = writable<ConnectionStatus>('disconnected');
export const callStatus = writable<CallStatus>('idle');
export const activeMode = writable<CallMode | null>(null);
export const errorMessage = writable<string | null>(null);
export const activeCallDuration = writable<number>(0); // In milliseconds

// Internal references (not stores, managed within the service)
let activeSipInstance: UserAgent | SimpleUser | null = null;
let activeUserAgentSession: Inviter | Session | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
let callStartTime: number | null = null;
let timerInterval: number | undefined = undefined;
let currentDemoConfig: DemoConfig | null = null;
let currentKiezboxConfig: KiezboxConfig | null = null;

// --- SimpleUser Delegate Implementation (Updates stores) ---
const simpleUserDelegateHandler: SimpleUserDelegate = {
	onCallCreated: (): void => {
		console.log(`[CallService] SimpleUser Call created (Dialing)`);
		callStatus.set('dialing');
		errorMessage.set(null);
		resetTimer();
	},
	onCallAnswered: (): void => {
		console.log(`[CallService] SimpleUser Call answered (Active)`);
		callStatus.set('active');
		startTimer();
		// SimpleUser typically handles attaching audio via its config, but check if needed
		if (activeSipInstance instanceof SimpleUser && currentAudioElement) {
			// Ensure audio is attached if SimpleUser didn't do it
			// Note: SimpleUser is supposed to handle this via media config
		}
	},
	onCallHangup: (): void => {
		console.log(`[CallService] SimpleUser Call hangup (Idle)`);
		// Only update if state wasn't already reset by hangup() or cleanup()
		if (get(callStatus) !== 'idle') {
			callStatus.set('idle');
			stopTimer(); // Keep final duration
		}
	},
	onCallHold: (held: boolean): void => {
		console.log(`[CallService] SimpleUser Call hold: ${held}`);
	},
	onServerConnect: () => {
		console.log('[CallService] SimpleUser Connected to server');
		// Only update if we were in the connecting state
		if (get(connectionStatus) === 'connecting') {
			connectionStatus.set('connected');
		}
	},
	onServerDisconnect: (error?: Error) => {
		console.warn('[CallService] SimpleUser Disconnected from server', error);
		connectionStatus.set(error ? 'failed' : 'disconnected');
		errorMessage.set(error ? `Connection Failed: ${error.message}` : null);
		callStatus.set('idle');
		stopTimer();
		activeSipInstance = null;
	}
};

// --- Timer Logic (Updates store) ---
function startTimer() {
	stopTimer();
	callStartTime = Date.now();
	activeCallDuration.set(0);
	timerInterval = setInterval(() => {
		if (callStartTime) {
			activeCallDuration.set(Date.now() - callStartTime);
		} else {
			stopTimer();
		}
	}, 1000);
	console.log('[CallService] Timer started');
}

function stopTimer() {
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = undefined;
		console.log('[CallService] Timer stopped');
	}
	callStartTime = null;
}
function resetTimer() {
	stopTimer();
	activeCallDuration.set(0);
}

// --- Core Service Functions (Update stores) ---

export async function initialize(
	mode: CallMode,
	audioElement: HTMLAudioElement,
	config: DemoConfig | KiezboxConfig
): Promise<void> {
	const currentConnStatus = get(connectionStatus);
	if (currentConnStatus !== 'disconnected' && currentConnStatus !== 'failed') {
		console.warn(`[CallService] Already ${currentConnStatus}. Cleanup first or ignore.`);
		return;
	}

	await cleanup(); // Ensure clean state

	console.log(`[CallService] Initializing for mode: ${mode}`);
	activeMode.set(mode);
	currentAudioElement = audioElement; // Store the reference
	errorMessage.set(null);
	connectionStatus.set('connecting');
	activeSipInstance = null;
	activeUserAgentSession = null;

	try {
		if (mode === 'demo') {
			currentDemoConfig = config as DemoConfig;
			if (!currentAudioElement) throw new Error('Audio element required for SimpleUser.');

			const simpleUser = new Web.SimpleUser(currentDemoConfig.demoWSS, {
				delegate: simpleUserDelegateHandler,
				media: { remote: { audio: currentAudioElement } },
				userAgentOptions: { displayName: currentDemoConfig.demoDisplayName, logLevel: 'debug' }
			});
			activeSipInstance = simpleUser;
			console.log('[CallService] Connecting SimpleUser...');
			await simpleUser.connect();
			// onServerConnect delegate updates status store
		} else {
			// emergency mode
			currentKiezboxConfig = config as KiezboxConfig;
			const userAgent = await createUserAgent(currentKiezboxConfig);
			if (!userAgent) throw new Error('Failed to create UserAgent via service.');
			activeSipInstance = userAgent;

			userAgent.delegate = {
				onConnect: () => {
					console.log('[CallService] UserAgent Connected');
					if (get(connectionStatus) === 'connecting') {
						connectionStatus.set('connected');
					}
				},
				onDisconnect: (error?: Error) => {
					console.warn('[CallService] UserAgent Disconnected', error);
					connectionStatus.set(error ? 'failed' : 'disconnected');
					errorMessage.set(error ? `Connection Failed: ${error.message}` : null);
					callStatus.set('idle');
					stopTimer();
					activeUserAgentSession = null;
					activeSipInstance = null;
				},
				onInvite: (invitation: Invitation) => {
					console.log(`[CallService] UserAgent Incoming Call... Rejecting.`);
					invitation.reject().catch((e) => console.error('Error rejecting:', e));
				}
			};

			if (userAgent.isConnected()) {
				connectionStatus.set('connected');
			}
		}
		console.log(`[CallService] Init sequence complete. Status: ${get(connectionStatus)}`);
	} catch (error: any) {
		console.error(`[CallService] Initialization failed for mode ${mode}:`, error);
		errorMessage.set(`Initialization failed: ${error?.message || 'Unknown error'}`);
		connectionStatus.set('failed');
		await cleanup(); // Ensure full cleanup on init failure
	}
}

export async function makeCall(target?: string): Promise<void> {
	if (get(connectionStatus) !== 'connected') {
		errorMessage.set('Cannot make call: Not connected.');
		console.error(`[CallService] ${get(errorMessage)}`);
		return;
	}
	if (get(callStatus) !== 'idle') {
		errorMessage.set('Cannot make call: Already in a call or dialing.');
		console.error(`[CallService] ${get(errorMessage)}`);
		return;
	}

	const mode = get(activeMode);
	console.log(`[CallService] Attempting call in mode: ${mode}`);
	callStatus.set('dialing');
	errorMessage.set(null);
	resetTimer();

	try {
		if (mode === 'demo' && activeSipInstance instanceof SimpleUser && currentDemoConfig) {
			console.log(`[CallService] Calling SimpleUser target: ${currentDemoConfig.demoTarget}`);
			await activeSipInstance.call(currentDemoConfig.demoTarget);
			// Delegate handles further state updates
		} else if (mode === 'emergency' && activeSipInstance instanceof UserAgent) {
			if (!target) throw new Error('Target URI required for emergency call.');
			console.log(`[CallService] Calling UserAgent target: ${target}`);
			const session = await inviteUserAgent(activeSipInstance, target);
			if (!session) throw new Error('Failed to initiate call via UserAgent service.');

			activeUserAgentSession = session;

			// Manual audio handling for UserAgent session established state
			session.stateChange.addListener((newState: SessionState) => {
				console.log(`[CallService] UA Session ${session.id} State: ${newState}`);
				if (activeUserAgentSession !== session) return; // Ignore events from old sessions

				switch (newState) {
					case SessionState.Establishing:
						callStatus.set('dialing');
						break;
					case SessionState.Established:
						callStatus.set('active');
						startTimer();
						break;
					case SessionState.Terminating:
						if (get(callStatus) !== 'idle') {
							callStatus.set('terminating');
						}
						break;
					case SessionState.Terminated:
						if (get(callStatus) !== 'idle') {
							callStatus.set('idle');
							stopTimer();
						}
						if (activeUserAgentSession === session) {
							activeUserAgentSession = null;
						}
						break;
				}
			});
		} else {
			throw new Error(
				`Invalid state for making call: Mode=${mode}, InstanceType=${activeSipInstance?.constructor.name}`
			);
		}
		console.log('[CallService] Call initiation process started.');
	} catch (error: any) {
		console.error('[CallService] Failed to make call:', error);
		errorMessage.set(`Call failed: ${error?.message || 'Unknown error'}`);
		callStatus.set('failed');
		activeUserAgentSession = null;
		stopTimer();
	}
}

export async function hangup(): Promise<void> {
	const currentCallStatus = get(callStatus);
	if (currentCallStatus !== 'dialing' && currentCallStatus !== 'active') {
		console.warn(
			`[CallService] No active or dialing call to hangup (State: ${currentCallStatus}).`
		);
		return;
	}

	console.log('[CallService] Attempting to hangup call...');
	callStatus.set('terminating'); // Indicate user intent
	errorMessage.set(null);
	stopTimer(); // Stop timer on hangup attempt

	try {
		const mode = get(activeMode);
		if (mode === 'demo' && activeSipInstance instanceof SimpleUser) {
			if (activeSipInstance.isConnected() || currentCallStatus === 'dialing') {
				await activeSipInstance.hangup();
			} else {
				console.warn('[CallService] SimpleUser had no active call to hangup.');
				callStatus.set('idle'); // Revert if nothing hung up
			}
			// Delegate onCallHangup should set final state
		} else if (mode === 'emergency' && activeUserAgentSession) {
			await terminateSession(activeUserAgentSession);
			// Session state listener 'Terminated' should set final state
		} else {
			console.warn('[CallService] Cannot hangup: No active instance/session for mode.', mode);
			callStatus.set('idle'); // Revert if nothing to hangup
		}
		console.log('[CallService] Hangup initiated.');
	} catch (error: any) {
		console.error('[CallService] Failed to hangup:', error);
		errorMessage.set(`Hangup failed: ${error?.message || 'Unknown error'}`);
		callStatus.set(currentCallStatus); // Revert status if hangup command fails
	}
	// Final state ('idle') should be set by listeners/delegates
}

export async function cleanup(): Promise<void> {
	console.log('[CallService] Cleanup requested...');

	if (get(callStatus) === 'dialing' || get(callStatus) === 'active') {
		console.log('[CallService] Hanging up active call before cleanup...');
		await hangup();
	}

	connectionStatus.set('disconnecting');
	stopTimer();

	try {
		const instance = activeSipInstance; // Local ref before resetting
		if (instance instanceof SimpleUser) {
			if (instance.isConnected()) {
				await instance.disconnect();
			}
		} else if (instance instanceof UserAgent) {
			await stopUserAgent(instance);
		}
	} catch (error: any) {
		console.error('[CallService] Error during disconnect/stop:', error);
	} finally {
		console.log('[CallService] Resetting all state.');
		connectionStatus.set('disconnected');
		callStatus.set('idle');
		errorMessage.set(null);
		activeCallDuration.set(0);
		activeSipInstance = null;
		activeUserAgentSession = null;
		activeMode.set(null);
		currentAudioElement = null;
		currentDemoConfig = null;
		currentKiezboxConfig = null;
		console.log('[CallService] Cleanup finished.');
	}
}

// Function to explicitly set the audio element reference
export function setAudioElement(element: HTMLAudioElement): void {
	console.log('[CallService] Setting audio element reference.');
	currentAudioElement = element;
}
