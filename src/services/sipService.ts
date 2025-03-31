// src/lib/sipServiceRunes.ts
import * as SIP from 'sip.js';
// Import specific types from sip.js
import type {
	Invitation,
	Inviter,
	Registerer,
	Session,
	SessionState,
	URI,
	UserAgent,
	UserAgentOptions,
	RegistererState
} from 'sip.js';

import { PUBLIC_SIP_WS_URL, PUBLIC_SIP_DOMAIN } from '$env/static/public';
import { apiFetch } from '$lib/api'; // Assuming apiFetch is typed or you add types

// Interface for the credentials fetched from the API
interface SipCredentials {
	uri: string;
	authorizationUser: string;
	password?: string; // Password might be optional depending on auth method
	// Add other fields if your API returns more
}

// Type alias for call states for better readability
export type CallState = 'idle' | 'ringing_in' | 'ringing_out' | 'active' | 'held';

// --- State managed by Runes ---
export let isConfigured: boolean = $state(false);
export let isConnecting: boolean = $state(false);
export let isConnected: boolean = $state(false); // WebSocket connected
export let isRegistered: boolean = $state(false); // SIP registration
export let registrationError: string | null = $state(null);
export let userAgent: UserAgent | null = $state(null);
export let activeSession: Session | null = $state(null);
export let incomingSession: Invitation | null = $state(null); // Specifically Invitation for incoming
export let callState: CallState = $state('idle');
export let errorMessage: string | null = $state(null);
export let audioElement: HTMLAudioElement | null = $state(null);

// --- Internal variables (not reactive state) ---
let currentRegisterer: Registerer | null = null;
let sipCredentials: SipCredentials | null = null;

// --- Functions ---

async function fetchSipCredentials(): Promise<boolean> {
	try {
		// Assuming apiFetch returns 'any' or you have a typed wrapper
		const creds: SipCredentials = await apiFetch('/sip-credentials');
		if (!creds || !creds.uri || !creds.authorizationUser /*|| !creds.password needed?*/) {
			throw new Error('Incomplete SIP credentials received');
		}
		sipCredentials = creds;
		console.log('SIP credentials fetched successfully.');
		return true;
	} catch (error: unknown) {
		console.error('Failed to fetch SIP credentials:', error);
		isConfigured = false;
		errorMessage = `Failed to get SIP config: ${error instanceof Error ? error.message : 'Unknown error'}`;
		return false;
	}
}

export async function connectSip(): Promise<void> {
	if (isConnecting || isConnected || isConfigured) {
		console.log('SIP connection already in progress, established or configured.');
		return;
	}

	isConnecting = true;
	errorMessage = null;

	if (!sipCredentials) {
		const success = await fetchSipCredentials();
		if (!success) {
			isConnecting = false;
			return;
		}
	}
	// Ensure sipCredentials is not null after fetching
	if (!sipCredentials) {
		console.error('SIP credentials are null after fetch attempt.');
		errorMessage = 'Failed to initialize: Missing SIP credentials.';
		isConnecting = false;
		return;
	}

	if (!audioElement) {
		console.warn('Audio element not initialized before connectSip.');
		initializeAudio();
		if (!audioElement) {
			errorMessage = 'Audio element could not be initialized.';
			isConnecting = false;
			return;
		}
	}

	const transportOptions: unknown = {
		server: PUBLIC_SIP_WS_URL
		// connectionTimeout: 5, // Example: seconds
		// keepAliveInterval: 30, // Example: seconds
	};

	const uri: URI | undefined = SIP.UserAgent.makeURI(sipCredentials.uri);
	if (!uri) {
		console.error('Failed to create SIP URI from:', sipCredentials.uri);
		isConnecting = false;
		isConfigured = false;
		errorMessage = 'Invalid SIP URI provided.';
		return;
	}

	const userAgentOptions: UserAgentOptions = {
		transportOptions,
		uri: uri,
		authorizationUsername: sipCredentials.authorizationUser,
		authorizationPassword: sipCredentials.password, // Optional based on your auth
		allowLegacyNotifications: true,
		// noAnswerTimeout: 60,
		logLevel: 'debug' // Use SIP.LogLevel enum if available/preferred
		// sipExtension100rel: SIP.SIPExtension.Unsupported, // Example option
		// replaces: SIP.SIPExtension.Unsupported, // Example option
	};

	const newUa = new SIP.UserAgent(userAgentOptions);
	userAgent = newUa; // Assign to $state

	// Setup delegates with proper types
	newUa.delegate = {
		onConnect: () => {
			console.log('SIP WebSocket Connected!');
			isConnected = true;
			isConnecting = false;
			register();
		},
		onDisconnect: (error?: Error) => {
			// Error is optional
			console.error('SIP WebSocket Disconnected.', error);
			isConnected = false;
			isConnecting = false;
			isRegistered = false;
			registrationError = null;
			activeSession = null;
			incomingSession = null;
			callState = 'idle';
			errorMessage = error ? `Disconnected: ${error.message}` : 'Disconnected';
			userAgent = null;
			currentRegisterer = null;
			// Reconnection logic...
		},
		onInvite: (invitation: Invitation) => {
			console.log('Incoming Call Invitation received!');
			if (callState !== 'idle' && callState !== 'ringing_in') {
				console.warn(`Incoming call while state is ${callState}, rejecting.`);
				invitation.reject().catch((e) => console.error('Error rejecting call:', e));
				return;
			}
			incomingSession = invitation;
			callState = 'ringing_in';
			setupSessionEventHandlers(invitation); // Pass the Invitation
		}
		// Add other delegate methods as needed with their types
		// onNotify: (notification: SIP.Notification) => { ... },
		// onRefer: (referral: SIP.Referral) => { ... },
	};

	try {
		await newUa.start();
		isConfigured = true;
	} catch (e: any) {
		console.error('Failed to start UserAgent:', e);
		isConnecting = false;
		isConfigured = false;
		errorMessage = `Connection failed: ${e?.message || 'Unknown error'}`;
		userAgent = null;
	}
}

function register(): void {
	const ua = userAgent; // Get current value of the $state variable
	if (!ua || !isConnected) {
		console.warn('Cannot register, UserAgent not connected.');
		return;
	}
	// Dispose previous registerer if exists? Depends on sip.js behavior/your needs
	// currentRegisterer?.dispose();

	// No specific delegate needed for Registerer itself unless you need its state changes
	currentRegisterer = new SIP.Registerer(ua /*, { options } */);

	currentRegisterer.stateChange.addListener((newState: RegistererState) => {
		console.log(`Registration State Changed: ${newState}`);
		switch (newState) {
			case SIP.RegistererState.Registered:
				isRegistered = true;
				registrationError = null;
				break;
			case SIP.RegistererState.Unregistered: // Failed or explicitly unregistered
			case SIP.RegistererState.Terminated: // Usually means failed permanently
				isRegistered = false;
				// Avoid setting error on normal unregister? Check context if possible.
				// if (newState === SIP.RegistererState.Terminated) {
				//     registrationError = registrationError ?? 'Registration Terminated';
				// }
				break;
		}
	});

	console.log('Attempting SIP Registration...');
	currentRegisterer.register(/* { requestOptions } */).catch((e: any) => {
		console.error('SIP Registration failed:', e);
		isRegistered = false;
		// Extract a meaningful message if possible
		registrationError = e?.message || (typeof e === 'string' ? e : 'Registration failed');
	});
}

export async function disconnectSip(): Promise<void> {
	if (currentRegisterer && isRegistered) {
		console.log('Unregistering...');
		try {
			await currentRegisterer.unregister(/* { requestOptions } */);
		} catch (e) {
			console.warn('Error during unregister:', e);
		} finally {
			currentRegisterer?.dispose(); // Clean up the registerer object
			currentRegisterer = null;
		}
	}
	const ua = userAgent;
	if (ua) {
		console.log('Stopping UserAgent...');
		try {
			await ua.stop();
			// onDisconnect delegate handles state reset
		} catch (e) {
			console.warn('Error stopping user agent:', e);
			// Manually reset state if stop() fails badly and onDisconnect doesn't fire
			isConnected = false;
			isConnecting = false;
			isRegistered = false;
			// ... reset other relevant states ...
			userAgent = null;
		}
	} else {
		// Ensure state reflects disconnection if userAgent was already null
		isConnected = false;
		isRegistered = false;
		isConnecting = false;
	}
}

export async function makeCall(targetUriString: string): Promise<void> {
	const ua = userAgent;
	if (!ua || !isRegistered) {
		errorMessage = 'Cannot make call: Not registered.';
		console.error(errorMessage);
		return;
	}
	if (callState !== 'idle') {
		errorMessage = 'Cannot make call: Already in a call or ringing.';
		console.error(errorMessage);
		return;
	}

	const target: URI | undefined = SIP.UserAgent.makeURI(targetUriString);
	if (!target) {
		errorMessage = `Invalid target URI: ${targetUriString}`;
		console.error(errorMessage);
		return;
	}

	const inviter = new SIP.Inviter(ua, target /*, { InviterOptions } */);
	setupSessionEventHandlers(inviter); // Setup handlers

	activeSession = inviter; // Assign the Inviter (which is a Session)
	callState = 'ringing_out';
	errorMessage = null;

	try {
		// Request microphone permissions and setup local media stream
		// Note: getUserMedia types are usually available via DOM lib in tsconfig
		const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false
		});
		// You might need to handle the stream (e.g., attach it to the SessionDescriptionHandler)
		const constraints = { audio: true, video: false };
		await inviter.invite({
			sessionDescriptionHandlerOptions: {
				constraints
				// Pass the stream if required by your SessionDescriptionHandlerFactory setup
				// mediaStreamFactory: () => Promise.resolve(stream)
			}
			// requestDelegate: { ... },
			// waitForAnswer: true/false
		});
		console.log('Call invitation sent.');
	} catch (error: any) {
		console.error('Failed to send invite or get media:', error);
		activeSession = null; // Clear session on failure
		callState = 'idle';
		errorMessage = `Call failed: ${error?.message || 'Unknown error'}`;
		inviter.dispose(); // Clean up the failed inviter
	}
}

export async function answerCall(): Promise<void> {
	const sessionToAnswer = incomingSession; // Get current value
	if (!sessionToAnswer || callState !== 'ringing_in') {
		errorMessage = 'No incoming call to answer.';
		console.error(errorMessage);
		return;
	}

	try {
		const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false
		});
		const constraints = { audio: true, video: false };
		await sessionToAnswer.accept({
			sessionDescriptionHandlerOptions: {
				constraints
				// mediaStreamFactory: () => Promise.resolve(stream)
			}
		});
		console.log('Call accepted.');
		// State transition usually handled by 'Established' state change handler
		// We set it here for immediate feedback, but Established handler should confirm
		activeSession = sessionToAnswer; // Move from incoming to active
		incomingSession = null;
		callState = 'active';
	} catch (error: any) {
		console.error('Failed to accept call:', error);
		errorMessage = `Failed to answer: ${error?.message || 'Unknown error'}`;
		// If accept fails, the session might terminate itself, handled by Terminated state
		// Resetting state here might conflict with session state events
		// Consider only resetting if the session didn't become active:
		if (activeSession !== sessionToAnswer) {
			incomingSession = null; // Clear incoming ref
			callState = 'idle';
		}
		sessionToAnswer.dispose(); // Clean up failed session
	}
}

export async function hangupCall(): Promise<void> {
	let sessionToTerminate: Session | Invitation | null = null;
	let action: 'reject' | 'terminate' | 'cancel' | null = null;

	// Read state directly
	if (callState === 'ringing_in' && incomingSession) {
		sessionToTerminate = incomingSession;
		action = 'reject';
	} else if (callState === 'ringing_out' && activeSession instanceof SIP.Inviter) {
		// If call is ringing out (Inviter state), use cancel
		sessionToTerminate = activeSession;
		action = 'cancel';
	} else if ((callState === 'active' || callState === 'held') && activeSession) {
		sessionToTerminate = activeSession;
		action = 'terminate';
	}

	if (!sessionToTerminate || !action) {
		console.warn('No active, incoming, or outgoing call to hangup/reject/cancel.');
		return;
	}

	console.log(`${action.charAt(0).toUpperCase() + action.slice(1)}ing call...`);
	try {
		switch (action) {
			case 'reject':
				// Invitation specific method
				await (sessionToTerminate as Invitation).reject();
				break;
			case 'cancel':
				// Inviter specific method
				await (sessionToTerminate as Inviter).cancel();
				break;
			case 'terminate':
				// Generic Session method
				await sessionToTerminate.terminate();
				break;
		}
	} catch (e: any) {
		console.warn(`Error during call ${action}:`, e);
		// Session termination/state change should still be handled by the delegate
	} finally {
		// Setting state here can cause flicker if Terminated event handles it differently.
		// Relying on the Terminated event handler is generally more robust.
		// Optional: Set state immediately for UI responsiveness, but know it might be overwritten.
		// callState = 'idle';
		// if (activeSession === sessionToTerminate) activeSession = null;
		// if (incomingSession === sessionToTerminate) incomingSession = null;
	}
}

// Helper to setup common Session event handlers
// Accepts Session because Invitation inherits from Session
function setupSessionEventHandlers(session: Session): void {
	// Clear previous listeners if any (important!)
	session.stateChange.removeAllListeners?.();
	session.delegate = {}; // Reset delegate

	session.stateChange.addListener((newState: SessionState) => {
		console.log(`Session [${session.id}] State Changed: ${newState}`);
		// const currentAudioEl = audioElement; // Get current value if needed inside switch

		switch (newState) {
			case SIP.SessionState.Initial:
			case SIP.SessionState.Establishing:
				break; // In progress
			case SIP.SessionState.Established:
				console.log(`Session [${session.id}] Established (Call Active)`);
				// Ensure this session is marked as active
				activeSession = session;
				// If this was the incoming call, clear the incomingSession state
				if (incomingSession === session) {
					incomingSession = null;
				}
				callState = 'active';
				// Audio stream attachment handled by $effect
				break;
			case SIP.SessionState.Terminating:
				console.log(`Session [${session.id}] Terminating`);
				break;
			case SIP.SessionState.Terminated:
				const reason = (session as any).terminationReason || 'Normal'; // Access potentially private prop carefully or check type methods
				console.log(`Session [${session.id}] Terminated. Reason: ${reason}`);

				// Clear the specific session if it's the one we're tracking
				if (activeSession === session) {
					activeSession = null;
				}
				// Check incomingSession just in case (e.g., rejected call might terminate)
				if (incomingSession === session) {
					incomingSession = null;
				}
				// Only reset callState to idle if NO other call is active/ringing
				if (!activeSession && !incomingSession) {
					callState = 'idle';
				}
				// Set error message based on termination reason if desired
				errorMessage = reason !== 'Normal' ? `Call ended: ${reason}` : null;

				session.dispose(); // Clean up sip.js resources for this session
				break;
		}
	});

	// Optionally setup SessionDescriptionHandler delegates here if needed
	const sdh = session.sessionDescriptionHandler;
	if (sdh) {
		// Example: Logging SDP generation/processing
		// sdh.on("getDescription", (description: RTCSessionDescriptionInit) => { ... });
		// sdh.on("setDescription", (description: RTCSessionDescriptionInit) => { ... });

		// onTrack is often handled via peerConnectionDelegate if using WebRTC SDH
		if ('peerConnectionDelegate' in sdh) {
			(sdh as any).peerConnectionDelegate = {
				// Use 'as any' or find specific type if available
				onTrack: (event: RTCTrackEvent) => {
					console.log(`Track received for session ${session.id}:`, event.track.kind);
					// Audio attachment handled by $effect reacting to activeSession change
				}
			};
		}
	}
}

// Create the audio element once
export function initializeAudio(): void {
	// Check window for SSR safety
	if (!audioElement && typeof window !== 'undefined') {
		audioElement = new Audio();
		console.log('Audio element created and assigned to state.');
	}
}

// --- Effects for handling side-effects like audio stream ---
$effect(() => {
	const sess = activeSession; // Track the activeSession state rune
	const audioEl = audioElement; // Track the audioElement state rune

	// Type guard for session being established and having an SDH
	if (sess?.state === SIP.SessionState.Established && sess.sessionDescriptionHandler && audioEl) {
		const sdh = sess.sessionDescriptionHandler;
		console.log(`Effect: Attaching remote stream for session ${sess.id}`);

		// Ensure remoteMediaStream exists (it might not immediately after Established)
		// It's often populated slightly later via ontrack
		if (sdh.remoteMediaStream) {
			console.log(
				`Effect: Found remoteMediaStream with ${sdh.remoteMediaStream.getTracks().length} tracks.`
			);
			// It's generally recommended to create a *new* MediaStream for the <audio> element
			// and add tracks to it, rather than assigning the internal stream directly.
			const remoteStream = new MediaStream();
			sdh.remoteMediaStream.getTracks().forEach((track) => remoteStream.addTrack(track));

			audioEl.srcObject = remoteStream;
			audioEl.play().catch((e: DOMException) => {
				// Autoplay often requires user interaction first
				console.error('Audio play failed in effect:', e.name, e.message);
				errorMessage = 'Could not play call audio automatically. Click required?';
			});
		} else {
			console.warn(
				`Effect: Session ${sess.id} established, but remoteMediaStream not yet available on SDH.`
			);
			// onTrack within the peerConnectionDelegate (if using WebRTC SDH)
			// is the more reliable place to add tracks to the audio element's stream.
			// This effect might still be useful for *detecting* when the stream *should* be playing.
			// Consider creating the stream here and adding tracks in onTrack.
			if (!audioEl.srcObject) {
				audioEl.srcObject = new MediaStream(); // Prepare stream for tracks
			}
		}

		// Cleanup function when effect re-runs or component unmounts
		return () => {
			console.log(`Effect Cleanup: Detaching remote stream for session ${sess.id}`);
			if (audioEl && audioEl.srcObject instanceof MediaStream) {
				// Stop tracks before clearing srcObject
				audioEl.srcObject.getTracks().forEach((track) => track.stop());
				audioEl.srcObject = null;
			}
		};
	} else if (audioEl && !sess && audioEl.srcObject) {
		// Ensure audio is cleared if activeSession becomes null and srcObject exists
		console.log('Effect Cleanup: Clearing srcObject as activeSession is null');
		if (audioEl.srcObject instanceof MediaStream) {
			audioEl.srcObject.getTracks().forEach((track) => track.stop());
		}
		audioEl.srcObject = null;
	}
});
