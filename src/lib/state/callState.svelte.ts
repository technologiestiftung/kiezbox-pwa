import { PUBLIC_LOG_LEVEL, PUBLIC_USER_PREFIX, PUBLIC_WSS_PATH } from '$env/static/public';
import { apiFetch } from '$lib/api';
import { CallState } from '$lib/enums';
import { assignStream } from '$lib/utils/callUtils';
import {
	Invitation,
	Inviter,
	Registerer,
	RegistererState,
	Session,
	SessionState,
	UserAgent,
	Web,
	type UserAgentDelegate,
	type InviterInviteOptions,
	type LogLevel
} from 'sip.js';
import type { IncomingResponse, OutgoingRequestDelegate } from 'sip.js/lib/core';

// Service-specific variables that don't need to be in the store
let userAgent: UserAgent | null = $state<UserAgent | null>(null);
let registerer: Registerer | null = $state<Registerer | null>(null);
let activeSession: Session | Inviter | null = $state<Session | Inviter | null>(null);
let incomingInvitation: Invitation | null = $state<Invitation | null>(null);
let callTimerInterval: ReturnType<typeof setInterval> | null = $state<ReturnType<
	typeof setInterval
> | null>(null);
let callStartTime: number | null = $state<number | null>(null);

// Create the centralized store
export const CallStore = $state({
	callState: CallState.INITIALIZED as CallState,
	registererState: RegistererState.Initial as RegistererState,
	sipUser: null as SIPUser | null,
	initialized: false as boolean,

	errorMessage: null as string | null,
	callerId: null as string | null,
	isMicrophoneMuted: false as boolean,
	isSpeakerMuted: false as boolean,
	callDuration: 0 as number,
	remoteStream: null as MediaStream | null,

	// Audio elements
	localHTMLAudioElement: null as HTMLAudioElement | null,
	remoteAudioElement: null as HTMLAudioElement | null
});

// HELPER FUNCTIONS
const setError = (message: string | null): void => {
	CallStore.errorMessage = message;
	if (message) {
		console.error(`[CallStore] Error: ${message}`);
	}
};

const clearError = (): void => {
	if (CallStore.errorMessage) {
		CallStore.errorMessage = null;
	}
};

const applySpeakerMute = (): void => {
	if (CallStore.remoteAudioElement) {
		CallStore.remoteAudioElement.muted = CallStore.isSpeakerMuted;
	}
};

const getPeerConnection = (): RTCPeerConnection | undefined => {
	const sdh = activeSession?.sessionDescriptionHandler as Web.SessionDescriptionHandler | undefined;
	return sdh?.peerConnection;
};

const startCallTimer = (): void => {
	stopCallTimer();
	callStartTime = Date.now();
	CallStore.callDuration = 0;

	callTimerInterval = setInterval(() => {
		if (callStartTime) {
			CallStore.callDuration = Math.floor((Date.now() - callStartTime) / 1000);
		}
	}, 1000);
};

const stopCallTimer = (): void => {
	if (callTimerInterval) {
		clearInterval(callTimerInterval);
		callTimerInterval = null;
	}
	callStartTime = null;
};

// Function to clean up a session
const cleanupSession = (session?: Session | Inviter | null): void => {
	if (!userAgent) {
		return;
	}

	if (!session && !activeSession) {
		return;
	}

	const sessionToClean = session || activeSession;
	if (!sessionToClean) return;

	if (sessionToClean.delegate) {
		sessionToClean.delegate = undefined;
	}

	if (activeSession && activeSession.id === sessionToClean.id) {
		activeSession = null;
	}

	stopCallTimer();
	CallStore.callState = CallState.CALL_TERMINATED;
	CallStore.callerId = null;
	CallStore.callDuration = 0;
	CallStore.remoteStream = null;
	CallStore.isMicrophoneMuted = false;
	CallStore.isSpeakerMuted = false;

	if (CallStore.remoteAudioElement) {
		CallStore.remoteAudioElement.srcObject = null;
	}
};

// Function to clean up the user agent
const cleanupUserAgent = async (): Promise<void> => {
	try {
		CallStore.callState = CallState.CALL_TERMINATING;

		// Check if we even have an active UserAgent
		if (!userAgent) {
			return;
		}

		// Store reference and set to null immediately to prevent duplicate cleanup
		const uaToStop = userAgent;
		userAgent = null;

		// Unregister only if registered
		if (registerer && CallStore.registererState === RegistererState.Registered) {
			try {
				await registerer.unregister();
				console.log('[CallStore] Unregistered successfully.');
			} catch (error: unknown) {
				console.warn('[CallStore] Error during unregister:', error);
			} finally {
				registerer = null;
			}
		}

		// Stop UserAgent with proper error handling
		if (uaToStop) {
			try {
				console.log('[CallStore] Stopping UserAgent...');
				if (uaToStop.isConnected()) {
					await uaToStop.stop();
				}
			} catch (error: unknown) {
				console.warn('[CallStore] Error stopping UserAgent:', error);
			}
		}
	} catch (error: unknown) {
		// Global error handler for the entire cleanup process
		setError(`Failed to cleanup: ${error}`);
	} finally {
		// Always reset state regardless of errors
		registerer = null;
		cleanupSession();
		incomingInvitation = null;

		CallStore.callState = CallState.DISCONNECTED;
		CallStore.registererState = RegistererState.Initial;
		CallStore.callerId = null;
		CallStore.callDuration = 0;
		CallStore.isMicrophoneMuted = false;
		CallStore.isSpeakerMuted = false;
		CallStore.remoteStream = null;
		CallStore.localHTMLAudioElement = null;
		// Keep last error
	}
};

// User agent delegate
const createUserAgentDelegate = (): UserAgentDelegate => {
	return {
		onConnect: () => {
			clearError(); // Clear connection errors
			register(); // Attempt registration
		},

		onDisconnect: (error: Error) => {
			CallStore.callState = CallState.DISCONNECTED;
			CallStore.registererState = RegistererState.Terminated;
			setError(`Disconnected: ${error.message}`);
			cleanupSession(); // Call ends on disconnect
		},

		onInvite: (invitation: Invitation) => {
			if (activeSession) {
				invitation.reject({ statusCode: 486 });
				setError('Call rejected: Already in another call.');
				return;
			}

			incomingInvitation = invitation;
			CallStore.callState = CallState.CALL_INCOMING;
			CallStore.callerId =
				invitation.remoteIdentity.displayName || invitation.remoteIdentity.uri.toString();
			setupSession(invitation); // Setup delegates for incoming call
		}
	};
};

// Setup session delegates and handlers
const setupSession = (session: Session | Invitation | Inviter) => {
	if (activeSession && activeSession !== session) {
		cleanupSession();
	}

	if (session instanceof Session) {
		activeSession = session;
		CallStore.isMicrophoneMuted = false;
		CallStore.isSpeakerMuted = false;
		applySpeakerMute();
	}

	session.stateChange.addListener((newState: SessionState) => {
		if (newState === SessionState.Established) {
			CallStore.callState = CallState.CALL_ESTABLISHED;
			startCallTimer();

			const sessionDescriptionHandler = session.sessionDescriptionHandler;

			if (
				!sessionDescriptionHandler ||
				!(sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)
			) {
				throw new Error('Invalid session description handler.');
			}

			if (CallStore.remoteAudioElement) {
				assignStream(
					sessionDescriptionHandler.remoteMediaStream,
					CallStore.remoteAudioElement,
					setError
				);
			}
		} else if (newState === SessionState.Terminated) {
			cleanupSession(session);
		} else if (newState === SessionState.Terminating) {
			CallStore.callState = CallState.CALL_TERMINATED;
		}
	});
};

// Create outgoing request delegate
const createOutgoingRequestDelegate = (): OutgoingRequestDelegate => {
	return {
		onAccept: () => {
			CallStore.callState = CallState.CALL_ESTABLISHED;
		},
		onReject: () => {
			CallStore.callState = CallState.CALL_REJECTED;
			cleanupSession(); // Clean up on reject
		},
		onRedirect: (response: IncomingResponse) => {
			setError(`Call redirected: ${response.message}`);
			CallStore.callState = CallState.CALL_REDIRECTED;
			cleanupSession(); // Clean up on redirect
		},
		onTrying: () => {
			CallStore.callState = CallState.CALLING;
		}
	};
};

// Register function
const register = async () => {
	try {
		if (!userAgent) {
			setError('UserAgent not available for registration.');
			return;
		}

		registerer = new Registerer(userAgent);
		registerer.stateChange.addListener((newState: RegistererState) => {
			CallStore.registererState = newState;
		});

		await registerer.register();
	} catch (error: unknown) {
		if (error instanceof Error) {
			setError(`Registration error: ${error.message}`);
		} else {
			setError(`Registration error: ${String(error)}`);
		}
	}
};

/**
 * Fetch session information and create a SIP user
 * @returns SIP user information or null if error occurs
 */
export const fetchSessionAndCreateUser = async (): Promise<SIPUser | null> => {
	try {
		let session: SessionResponse;
		try {
			const response = await apiFetch('/api/session');
			session = response as SessionResponse;
			if (!session) throw new Error('Empty session from GET');
		} catch {
			// If GET fails, try POST
			const response = await apiFetch('/api/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			session = response as SessionResponse;
			if (!session) throw new Error('Empty session from POST');
		}

		const user: SIPUser = {
			username: PUBLIC_USER_PREFIX + session.extension.toString().padStart(4, '0'),
			password: session.password,
			timestamp: session.timestamp
		};

		CallStore.sipUser = user;
		return user;
	} catch (error) {
		console.error('Error fetching session:', error);
		setError(`Failed to fetch session: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
};

/**
 * Initialize the call service with SIP configuration and audio element
 */
export const initCallService = async (audioElement: HTMLAudioElement): Promise<void> => {
	if (!audioElement) {
		throw new Error('Audio element is required for call service initialization');
	}

	// Clean up any existing instance first
	if (CallStore.initialized) {
		await cleanupCallService();
	}

	CallStore.remoteAudioElement = audioElement;
	CallStore.initialized = true;

	console.log('[CallStore] Service initialized');
};

/**
 * Create a SIP user agent for communication
 */
export const createUserAgent = async (sipUser: SIPUser): Promise<void> => {
	if (!CallStore.initialized) {
		throw new Error('Call service not initialized');
	}
	// Store the user
	CallStore.sipUser = sipUser;

	// Clear any errors
	clearError();

	try {
		// Create the UserAgent if needed
		if (!userAgent || CallStore.callState === CallState.DISCONNECTED) {
			CallStore.callState = CallState.INITIALIZING;
			const isLocalhost = window.location.hostname === 'localhost';
			const host = isLocalhost ? 'emergency.ds-apps.tsb-berlin.de' : window.location.host;
			const kbWSS = `wss://${host}${PUBLIC_WSS_PATH}`;
			const kbURI = `sip:${sipUser.username}@host`;
			const uri = UserAgent.makeURI(kbURI);

			if (!uri) throw new Error(`Failed to create URI from ${kbURI}`);

			userAgent = new UserAgent({
				uri: uri,
				transportOptions: {
					server: kbWSS,
					connectionTimeout: 100,
					keepAliveInterval: 300
				},
				logLevel: (PUBLIC_LOG_LEVEL as LogLevel) || 'error',
				authorizationUsername: sipUser.username,
				authorizationPassword: sipUser.password,
				displayName: sipUser.displayName,
				delegate: createUserAgentDelegate()
			});

			await userAgent.start();
		} else {
			// If already connected, just register again
			register();
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			setError(`Failed to connect: ${error.message || error}`);
			await cleanupUserAgent();
		}
	} finally {
		CallStore.callState = CallState.INITIALIZED;
	}
};

/**
 * Make an outgoing call to the provided URI
 */
export const makeCall = async (targetUriString: string): Promise<void> => {
	if (!userAgent || CallStore.registererState !== RegistererState.Registered) {
		setError('Cannot make call: Not connected or registered.');
		return;
	}

	if (activeSession) {
		setError('Cannot make call: Already busy.');
		return;
	}

	clearError();

	try {
		const target = UserAgent.makeURI(targetUriString);
		if (!target) throw new Error(`Invalid target URI: ${targetUriString}`);

		const inviterOptions: InviterInviteOptions = {
			sessionDescriptionHandlerOptions: {
				constraints: { audio: true, video: false }
			},
			requestDelegate: createOutgoingRequestDelegate()
		};

		const inviter = new Inviter(userAgent, target);
		setupSession(inviter);
		activeSession = inviter;
		CallStore.callState = CallState.CALLING;
		await inviter.invite(inviterOptions);
	} catch (error: unknown) {
		if (error instanceof Error) {
			setError(`Failed to make call: ${error.message || error}`);
		} else {
			setError(`Failed to make call: ${error}`);
		}
		cleanupSession();
	}
};

/**
 * Answer an incoming call
 */
export const answerCall = async (): Promise<void> => {
	if (!incomingInvitation) {
		setError('No incoming call to answer.');
		return;
	}

	clearError();

	try {
		const invitationToAccept: Invitation = incomingInvitation;
		incomingInvitation = null;

		setupSession(invitationToAccept);

		const acceptOptions = {
			sessionDescriptionHandlerOptions: {
				constraints: { audio: true, video: false }
			}
		};

		CallStore.callState = CallState.CALL_INCOMING;
		CallStore.callerId = null;

		await invitationToAccept.accept(acceptOptions);
	} catch (error: unknown) {
		if (error instanceof Error) {
			setError(`Failed to answer call: ${error.message || error}`);
			cleanupSession();
			CallStore.callerId = null;
		}
	}
};

/**
 * Hangup active call or reject incoming call
 */
export const hangupOrReject = async (): Promise<void> => {
	clearError();
	CallStore.callState = CallState.CALL_TERMINATING;

	if (incomingInvitation) {
		try {
			await incomingInvitation.reject();
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Failed to reject call: ${error.message || error}`);
			} else {
				setError(`Failed to reject call: ${error}`);
			}
		} finally {
			incomingInvitation = null;
			CallStore.callState = CallState.CALL_TERMINATED;
			CallStore.callerId = null;
		}
	} else if (activeSession) {
		const sessionToTerminate = activeSession;
		const state = sessionToTerminate.state;
		activeSession = null;

		try {
			if (state === SessionState.Terminated || state === SessionState.Terminating) {
				return;
			} else if (
				(state === SessionState.Initial || state === SessionState.Establishing) &&
				sessionToTerminate instanceof Inviter
			) {
				await sessionToTerminate.cancel();
			} else {
				await sessionToTerminate.bye();
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Failed to hangup/cancel: ${error.message}`);
			} else {
				setError(`Failed to hangup/cancel: ${error}`);
			}
		} finally {
			cleanupSession(sessionToTerminate);
		}
	} else {
		cleanupSession();
		setError('No active call to hangup or reject.');
	}
};

/**
 * Toggle microphone mute state
 */
export const toggleMicrophoneMute = (): void => {
	if (!activeSession || CallStore.callState !== CallState.CALL_ESTABLISHED) {
		return;
	}

	const newState = !CallStore.isMicrophoneMuted;

	try {
		const pc = getPeerConnection();
		if (pc) {
			pc.getSenders().forEach((sender) => {
				if (sender.track?.kind === 'audio') {
					sender.track.enabled = !newState; // true = not muted
				}
			});
			CallStore.isMicrophoneMuted = newState;
		} else {
			setError('Failed to toggle microphone mute: No PeerConnection available.');
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			setError(`Failed to toggle microphone mute: ${error.message}`);
		} else {
			setError('Failed to toggle microphone mute.');
		}
	}
};

/**
 * Toggle speaker mute state
 */
export const toggleSpeakerMute = (): void => {
	CallStore.isSpeakerMuted = !CallStore.isSpeakerMuted;
	applySpeakerMute();
};

/**
 * Set the remote audio element
 */
export const setAudioElement = (element: HTMLAudioElement): void => {
	CallStore.remoteAudioElement = element;
	applySpeakerMute();
};

/**
 * Wait for registration to complete
 * @param timeoutMs Maximum time to wait for registration in milliseconds
 * @returns Promise that resolves when registered or rejects on timeout
 */
export const waitForRegistration = async (timeoutMs = 10000): Promise<void> => {
	const start = Date.now();
	return new Promise<void>((resolve, reject) => {
		const cleanup = () => clearInterval(checkInterval);

		const checkInterval = setInterval(() => {
			if (CallStore.registererState === RegistererState.Registered) {
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

/**
 * Single function to handle complete initialization
 * Connect to the SIP service with fetched config and create user agent
 * @param remoteAudioElement Audio element to use for calls
 */
export const initializeCallService = async (
	remoteAudioElement: HTMLAudioElement
): Promise<void> => {
	CallStore.initialized = true;
	if (!remoteAudioElement) {
		CallStore.initialized = false;
		throw new Error('Remote audio element not defined');
	}

	try {
		if (!CallStore.sipUser) {
			const user = await fetchSessionAndCreateUser();
			if (!user) {
				throw new Error('Failed to create SIP user');
			}
		}
		await initCallService(remoteAudioElement);
		await createUserAgent(CallStore.sipUser!);
	} catch (error) {
		setError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
		CallStore.initialized = false;
		throw error;
	}
};

/**
 * Handle call action based on current state
 * This function acts as a facade that handles different calling scenarios:
 * - If in a call, hang up
 * - If call is terminating, do nothing
 * - If not initialized, initialize first
 * - If incoming call, answer it
 * - If not registered, register first
 * - Otherwise make a call to the target URI
 *
 * @param targetUri URI to call if making a new call
 * @param remoteAudioElement Audio element to use if not already initialized
 * @param errorCallback Optional callback for error handling
 */
export const handleCallAction = async (
	targetUri: string,
	remoteAudioElement?: HTMLAudioElement,
	errorCallback?: (error: string) => void
): Promise<void> => {
	try {
		// If already in a call, hang up
		if (
			CallStore.callState === CallState.CALL_ESTABLISHED ||
			CallStore.callState === CallState.CALLING
		) {
			await hangupOrReject();
			return;
		}

		// If call is terminating, do nothing
		if (CallStore.callState === CallState.CALL_TERMINATING) {
			if (errorCallback) errorCallback('Call is terminating, please wait...');
			return;
		}

		// Initialize if needed
		if (!CallStore.initialized) {
			if (!remoteAudioElement) {
				throw new Error('Audio element required for initialization');
			}
			await initializeCallService(remoteAudioElement);
			if (!CallStore.initialized) return;
		}

		// Answer if incoming call
		if (CallStore.callState === CallState.CALL_INCOMING) {
			await answerCall();
			return;
		}

		// If not registered, try to register
		if (CallStore.registererState !== RegistererState.Registered && CallStore.sipUser) {
			console.warn('[CallStore] Not registered, attempting to connect...');

			await createUserAgent(CallStore.sipUser);

			try {
				await waitForRegistration();
			} catch (error: unknown) {
				if (errorCallback) errorCallback(String(error));
				return;
			}
		}

		// Make the call if registered
		if (CallStore.registererState === RegistererState.Registered) {
			await makeCall(targetUri);
		}
	} catch (error) {
		const errorMessage = `Call action failed: ${error instanceof Error ? error.message : String(error)}`;
		setError(errorMessage);
		if (errorCallback) errorCallback(errorMessage);
	}
};

/**
 * Clean up the call service completely
 */
export const cleanupCallService = async (): Promise<void> => {
	if (activeSession || incomingInvitation) {
		await hangupOrReject();
	}
	await cleanupUserAgent();
	CallStore.initialized = false;
	console.log('[CallStore] Service cleaned up');
};

// Utility setters
export const setMicrophoneMuted = (muted: boolean) => {
	CallStore.isMicrophoneMuted = muted;
};

export const setSpeakerMuted = (muted: boolean) => {
	CallStore.isSpeakerMuted = muted;
};

export const setCallDuration = (duration: number) => {
	CallStore.callDuration = duration;
};

// Status helper functions

/**
 * Get a human-readable status based on the current call state
 * @param translateFn Optional translation function to use (defaults to returning key)
 * @returns Status message
 */
export const getCallStatus = (translateFn?: (key: string) => string): string | null => {
	const t = translateFn || ((key: string) => key);

	switch (CallStore.callState) {
		case CallState.CALL_ESTABLISHED:
			return t('common.status.call_established');
		case CallState.CALLING:
			return t('common.status.calling');
		case CallState.CALL_FAILED:
			return t('common.status.call_failed');
		case CallState.CALL_REJECTED:
			return t('common.status.call_rejected');
		case CallState.CALL_TERMINATED:
			return t('common.status.call_terminated');
		case CallState.CONNECTED:
			return t('common.status.connected');
		case CallState.INITIALIZED:
			return null;
		default:
			return null; // No status for other states
	}
};

/**
 * Get button text based on call state and mode
 * @param isEmergency Whether we're in emergency mode
 * @param translateFn Optional translation function
 * @returns Button text
 */
export const getCallButtonText = (
	isEmergency: boolean | undefined,
	translateFn?: (key: string) => string
): string => {
	const t = translateFn || ((key: string) => key);

	switch (CallStore.callState) {
		case CallState.CALL_ESTABLISHED:
			return t('content.emergency_phone.active');
		case CallState.INITIALIZING:
			return t('content.emergency_phone.initializing');
		case CallState.CALLING:
			return t('content.emergency_phone.calling');
		case CallState.CALL_FAILED:
			return t('content.emergency_phone.failed');
		case CallState.CALL_INCOMING:
			return t('content.emergency_phone.incoming');
		default:
			return isEmergency
				? t('content.emergency_phone.call')
				: t('content.emergency_phone.callDemo');
	}
};

/**
 * Check if modal close should be disabled based on call state
 */
export const isCloseDisabled = (): boolean => {
	return (
		CallStore.callState === CallState.CALL_ESTABLISHED ||
		CallStore.callState === CallState.CALLING ||
		CallStore.callState === CallState.CALL_INCOMING ||
		CallStore.callState === CallState.CALL_REDIRECTED
	);
};
