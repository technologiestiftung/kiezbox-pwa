import { writable, get, readable, type Readable } from 'svelte/store';
import {
	Invitation,
	Inviter,
	Registerer,
	RegistererState,
	Session,
	SessionState,
	UserAgent,
	Web,
	type UserAgentDelegate
	// Add these imports for Logger
} from 'sip.js';

export interface KiezboxConfig {
	kbServerAddress: string;
	kbWSSPort: number;
	kbWSSPath: string;
	kbDomain: string;
	kbSIPUsername: string;
	kbSIPPassword: string;
	kbisplayName: string;
}

export interface CallServiceState {
	callState: CallState;
	registererState: RegistererState;
	errorMessage: string | null;
	callerId: string | null;
	isMicrophoneMuted: boolean;
	isSpeakerMuted: boolean;
	callDuration: number;
	remoteStream: MediaStream | null;
	localHTMLAudioElement: HTMLAudioElement | null;
}

export enum CallState {
	DISCONNECTED = 'DISCONNECTED',
	CONNECTED = 'CONNECTED',
	CALLING = 'CALLING',
	CALL_INCOMING = 'CALL_INCOMING',
	CALL_ESTABLISHED = 'CALL_ESTABLISHED',
	CALL_TERMINATED = 'CALL_TERMINATED'
}

// --- Factory Function ---
export const createCallService = (config: KiezboxConfig) => {
	let remoteAudioElement: HTMLAudioElement | null = null;
	let userAgent: UserAgent | null = null;
	let registerer: Registerer | null = null;
	let activeSession: Session | Inviter | null = null;
	let incomingInvitation: Invitation | null = null;
	let callTimerInterval: ReturnType<typeof setInterval> | null = null;
	let callStartTime: number | null = null;

	// --- Reactive State Store ---
	const _state = writable<CallServiceState>({
		callState: CallState.DISCONNECTED,
		registererState: RegistererState.Initial,
		errorMessage: null,
		callerId: null,
		isMicrophoneMuted: false,
		isSpeakerMuted: false,

		callDuration: 0,
		remoteStream: null,
		localHTMLAudioElement: null
	});

	// Publicly readable version of the state
	const state: Readable<CallServiceState> = readable(get(_state), (set) => {
		// Forward updates from the writable store
		const unsubscribe = _state.subscribe(set);
		return () => unsubscribe(); // Cleanup subscription
	});

	// --- Helper Functions (scoped within the factory) ---

	const setError = (message: string | null): void => {
		_state.update((s) => ({ ...s, errorMessage: message }));
		if (message) {
			console.error(`[CallService] Error state set: ${message}`);
		}
	};

	const clearError = (): void => {
		if (get(_state).errorMessage) {
			_state.update((s) => ({ ...s, errorMessage: null }));
		}
	};

	const applySpeakerMute = (): void => {
		if (remoteAudioElement) {
			remoteAudioElement.muted = get(_state).isSpeakerMuted;
		}
	};

	const getPeerConnection = (): RTCPeerConnection | undefined => {
		// Type assertion needed as SDH type isn't specific enough in Session interface
		const sdh = activeSession?.sessionDescriptionHandler as
			| Web.SessionDescriptionHandler
			| undefined;
		return sdh?.peerConnection;
	};

	const stopCallTimer = (): void => {
		if (callTimerInterval) {
			clearInterval(callTimerInterval);
			callTimerInterval = null;
		}
		callStartTime = null;
		console.log('[CallService] Call timer stopped.');
	};

	const startCallTimer = (): void => {
		stopCallTimer(); // Clear existing timer just in case
		callStartTime = Date.now();
		_state.update((s) => ({ ...s, callDuration: 0 }));
		callTimerInterval = setInterval(() => {
			if (callStartTime) {
				_state.update((s) => ({ ...s, callDuration: Date.now() - callStartTime! }));
			}
		}, 1000);
		console.log('[CallService] Call timer started.');
	};

	const cleanupSession = (session?: Session | Inviter | null): void => {
		if (!userAgent) {
			console.warn('[CallService] No UserAgent available for cleanup.');
			return;
		}
		console.log('[CallService] Cleaning up session...');
		console.log(`[CallService] Active session: ${activeSession?.id}`);
		console.log(`[CallService] State: ${get(_state).callState}`);
		console.log(`[CallService] Incoming invitation: ${incomingInvitation?.id}`);
		if (!session && !activeSession) {
			console.warn('[CallService] No session to clean up.');
			return;
		}

		const sessionToClean = session || activeSession;
		if (!sessionToClean) return;

		console.log(`[CallService] Cleaning up session ${sessionToClean.id}...`);

		if (sessionToClean.delegate) {
			sessionToClean.delegate = undefined;
		}

		if (activeSession && activeSession.id === sessionToClean.id) {
			activeSession = null;
		}

		stopCallTimer();

		_state.update((s) => ({
			...s,
			callState: CallState.CALL_TERMINATED,
			isCallActive: false,
			isOutgoingCall: false,
			remoteStream: null,
			isMicrophoneMuted: false,
			isSpeakerMuted: false
		}));

		if (remoteAudioElement) {
			remoteAudioElement.srcObject = null;
		}
		console.log(`[CallService] Session ${sessionToClean.id} cleanup complete.`);
	};

	const cleanupUserAgent = async (): Promise<void> => {
		console.log('[CallService] Cleaning up UserAgent...');
		// Unregister
		if (registerer && get(_state).registererState === RegistererState.Registered) {
			try {
				await registerer.unregister();
				console.log('[CallService] Unregistered.');
			} catch (e) {
				console.error('[CallService] Error unregistering:', e);
			} finally {
				registerer = null;
				_state.update((s) => ({ ...s, isRegistered: false }));
			}
		}
		// Stop UserAgent
		if (userAgent) {
			const uaToStop = userAgent;
			userAgent = null; // Clear ref
			if (uaToStop.isConnected()) {
				try {
					await uaToStop.stop();
					console.log('[CallService] UserAgent stopped.');
				} catch (e) {
					console.error('[CallService] Error stopping UA:', e);
				}
			}
		}
		// reset state
		cleanupSession();
		incomingInvitation = null;
		_state.set({
			callState: CallState.DISCONNECTED,
			registererState: RegistererState.Initial,
			callerId: null,
			callDuration: 0,
			isMicrophoneMuted: false,
			isSpeakerMuted: false,
			remoteStream: null,
			localHTMLAudioElement: null,
			errorMessage: get(_state).errorMessage // Keep last error
		});
		console.log('[CallService] UserAgent cleanup complete.');
	};

	const register = async () => {
		try {
			if (!userAgent) {
				console.error('[CallService] Cannot register, UserAgent not available.');
				setError('UserAgent not available for registration.');
				return;
			}
			console.log('[CallService] Attempting registration...');
			registerer = new Registerer(userAgent);
			registerer.stateChange.addListener((newState: RegistererState) => {
				console.log(`[CallService] Registerer state changed to ${newState}`);
				_state.update((s) => ({ ...s, registererState: newState }));
			});

			await registerer.register();
			console.log('[CallService] Registration request sent.');
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`[CallService] Registration error: ${error.message}`);
				setError(`Registration error: ${error.message}`);
				_state.update((s) => ({ ...s, registererState: RegistererState.Terminated }));
				registerer = null;
			}
		}
	};

	const userAgentDelegate: UserAgentDelegate = {
		onConnect: () => {
			console.log('[CallService] UserAgent Connected via WebSocket.');
			_state.update((s) => ({ ...s, callState: CallState.CONNECTED }));
			setError(null); // Clear connection errors
			register(); // Attempt registration
		},
		onDisconnect: (error?: Error) => {
			console.error(`[CallService] UserAgent Disconnected.`, error);
			_state.update((s) => ({
				...s,
				callState: CallState.DISCONNECTED,
				registererState: RegistererState.Terminated
			}));
			if (error) {
				setError(`Disconnected: ${error.message}`);
			} else {
				console.log('[CallService] UserAgent disconnected gracefully.');
			}
			cleanupSession(); // Call ends on disconnect
		},
		onInvite: (invitation: Invitation) => {
			console.log(`[CallService] Incoming INVITE from ${invitation.remoteIdentity.uri.toString()}`);
			if (activeSession) {
				console.warn('[CallService] Rejecting invite - busy.');
				invitation.reject({ statusCode: 486 });
				return;
			}
			incomingInvitation = invitation;
			_state.update((s) => ({
				...s,
				callState: CallState.CALL_INCOMING,
				callerId: invitation.remoteIdentity.displayName || invitation.remoteIdentity.uri.toString()
			}));
			setupSession(invitation); // Setup delegates for incoming call
		}
	};

	const setupSession = (session: Session | Invitation | Inviter) => {
		if (activeSession && activeSession !== session) {
			console.warn(
				`[CallService] Warning: Setting up new session ${session.id} while ${activeSession.id} exists.`
			);
			cleanupSession(); // Cleanup old one first
		}
		console.log(`[CallService] Setting up session delegates for ${session.id}`);

		if (session instanceof Session) {
			activeSession = session;
			_state.update((s) => ({ ...s, isMicrophoneMuted: false, isSpeakerMuted: false }));
			applySpeakerMute();
		}

		session.stateChange.addListener((newState: SessionState) => {
			console.log(`[CallService] Session state changed to ${newState}`);
			if (newState === SessionState.Established) {
				_state.update((s) => ({ ...s, callState: CallState.CALL_ESTABLISHED }));
				startCallTimer(); // Start call timer on established

				const sessionDescriptionHandler = session.sessionDescriptionHandler;

				if (
					!sessionDescriptionHandler ||
					!(sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)
				) {
					throw new Error('Invalid session description handler.');
				}

				if (remoteAudioElement) {
					assignStream(sessionDescriptionHandler.remoteMediaStream, remoteAudioElement);
				}
				console.log(`[CallService] Call established. Call duration: ${get(_state).callDuration}`);
			} else if (newState === SessionState.Terminated) {
				cleanupSession(session); // Cleanup on termination
			} else if (newState === SessionState.Terminating) {
				_state.update((s) => ({ ...s, callState: CallState.CALL_TERMINATED }));
				console.log(`[CallService] Session is terminating.`);
			}
		});
	};

	const assignStream = (stream: MediaStream, element: HTMLMediaElement | null) => {
		if (!element) {
			console.error('HTMLMediaElement is not defined.');
			return;
		}
		// Set element source.
		element.autoplay = true;
		element.srcObject = stream;

		// Load and start playback of media.
		element.play().catch((error: Error) => {
			console.error('Failed to play media');
			console.error(error);
		});

		stream.onaddtrack = (): void => {
			element.load();
			element.play().catch((error: Error) => {
				console.error('Failed to play remote media on add track');
				console.error(error);
			});
		};

		stream.onremovetrack = (): void => {
			element.load();
			element.play().catch((error: Error) => {
				console.error('Failed to play remote media on remove track');
				console.error(error);
			});
		};
	};

	const setAudioElement = (element: HTMLAudioElement): void => {
		remoteAudioElement = element;
		console.log('[CallService] Audio element set.');
		applySpeakerMute(); // Apply current mute state if already set
	};

	const createUserAgent = async (): Promise<void> => {
		if (userAgent && get(_state).callState !== CallState.DISCONNECTED) {
			console.warn('[CallService] Already connected.');
			return;
		}
		clearError();

		try {
			console.log('[CallService] Creating UserAgent...');
			const kbWSS = `wss://${config.kbServerAddress}:${config.kbWSSPort}${config.kbWSSPath}`;
			const kbURI = `sip:${config.kbSIPUsername}@${config.kbDomain}`;
			const uri = UserAgent.makeURI(kbURI);
			if (!uri) throw new Error(`Failed to create URI from ${kbURI}`);

			userAgent = new UserAgent({
				uri: uri,
				transportOptions: { server: kbWSS, connectionTimeout: 10, keepAliveInterval: 30 },
				logLevel: 'debug',
				authorizationUsername: config.kbSIPUsername,
				authorizationPassword: config.kbSIPPassword,
				displayName: config.kbisplayName,
				delegate: userAgentDelegate
			});

			console.log('[CallService] Starting UserAgent connection...');
			await userAgent.start();
			console.log('[CallService] UserAgent start() called.');
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`[CallService] Error creating/starting UserAgent: ${error.message}`);
				console.error('[CallService] Error creating/starting UserAgent:', error);
				setError(`Failed to connect: ${error.message || error}`);
				await cleanupUserAgent(); // Cleanup on failure
			}
		}
	};

	const makeCall = async (targetUriString: string): Promise<void> => {
		if (!userAgent || get(_state).registererState !== RegistererState.Registered) {
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

			console.log(`[CallService] Creating Inviter for target: ${targetUriString}`);
			// Pass SDH options directly to invite
			const inviterOptions = {
				sessionDescriptionHandlerOptions: {
					constraints: { audio: true, video: false }
				}
			};
			const inviter = new Inviter(userAgent, target);

			setupSession(inviter); // Setup delegates
			activeSession = inviter; // Mark as active session attempt
			_state.update((s) => ({ ...s, callState: CallState.CALLING }));

			console.log(`[CallService] Sending INVITE to ${targetUriString}`);
			await inviter.invite(inviterOptions); // Pass options here
			console.log(`[CallService] INVITE sent for session ${inviter.id}`);
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`[CallService] Error making call: ${error.message}`);
				setError(`Failed to make call: ${error.message || error}`);
				cleanupSession(); // Cleanup failed call attempt
			}
		}
	};

	const answerCall = async (): Promise<void> => {
		if (!incomingInvitation) {
			setError('No incoming call to answer.');
			return;
		}
		if (activeSession) {
			setError('Cannot answer: Already in another call.');
			return;
		}
		clearError();
		console.log('[CallService] Accepting incoming call...');
		try {
			const invitationToAccept = incomingInvitation;
			incomingInvitation = null;

			const acceptOptions = {
				sessionDescriptionHandlerOptions: {
					constraints: { audio: true, video: false }
				}
			};
			_state.update((s) => ({ ...s, callState: CallState.CALL_INCOMING, callerId: null })); // Update UI state

			// Calling accept transitions the Invitation to a Session
			// and triggers SessionDelegate state changes.
			await invitationToAccept.accept(acceptOptions);
			console.log('[CallService] Incoming call accepted request sent.');
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`[CallService] Error accepting call: ${error.message}`);
				setError(`Failed to answer call: ${error.message || error}`);
				cleanupSession(); // Cleanup if accept fails
				_state.update((s) => ({ ...s, isIncomingCall: false, callerId: null }));
			}
		}
	};

	const hangupOrReject = async (): Promise<void> => {
		clearError();

		if (incomingInvitation) {
			console.log('[CallService] Rejecting incoming call...');
			try {
				await incomingInvitation.reject();
				console.log('[CallService] Incoming call rejected.');
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error(`[CallService] Error rejecting call: ${error.message}`);
					setError(`Failed to reject call: ${error.message || error}`);
				} else {
					console.error('[CallService] Error rejecting call:', error);
					setError(`Failed to reject call: ${error}`);
				}
			} finally {
				incomingInvitation = null;
				_state.update((s) => ({ ...s, callState: CallState.CALL_TERMINATED, callerId: null }));
			}
		} else if (activeSession) {
			console.log(`[CallService] Hanging up active call (Session ID: ${activeSession.id})...`);
			const sessionToTerminate = activeSession;
			const state = sessionToTerminate.state;
			activeSession = null;

			try {
				if (state === SessionState.Terminated || state === SessionState.Terminating) {
					console.log('[CallService] Session already terminated/terminating.');
				} else if (state === SessionState.Initial && sessionToTerminate instanceof Inviter) {
					await sessionToTerminate.cancel();
					console.log('[CallService] Outgoing call cancelled.');
				} else {
					await sessionToTerminate.bye();
					console.log('[CallService] BYE sent/confirmed.');
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error(`[CallService] Error during hangup/cancel: ${error.message}`);
					setError(`Failed to hangup/cancel: ${error.message || error}`);
				} else {
					console.error('[CallService] Error during hangup/cancel:', error);
					setError(`Failed to hangup/cancel: ${error}`);
				}
			} finally {
				cleanupSession(sessionToTerminate);
			}
		} else {
			console.warn('[CallService] No active call or incoming invitation to hangup/reject.');
		}
	};

	const toggleMicrophoneMute = (): void => {
		if (!activeSession || get(_state).callState !== CallState.CALL_ESTABLISHED) {
			// Check isCallActive too
			console.warn('[CallService] Cannot toggle mute: No established call.');
			return;
		}
		const newState = !get(_state).isMicrophoneMuted;
		try {
			const pc = getPeerConnection();
			if (pc) {
				pc.getSenders().forEach((sender) => {
					if (sender.track?.kind === 'audio') {
						sender.track.enabled = !newState; // true = not muted
					}
				});
				_state.update((s) => ({ ...s, isMicrophoneMuted: newState }));
				console.log(`[CallService] Microphone muted: ${newState}`);
			} else {
				console.warn('[CallService] PeerConnection not available to toggle mute.');
			}
		} catch (error) {
			console.error('[CallService] Error toggling microphone mute:', error);
			setError('Failed to toggle microphone mute.');
		}
	};

	const toggleSpeakerMute = (): void => {
		const newState = !get(_state).isSpeakerMuted;
		_state.update((s) => ({ ...s, isSpeakerMuted: newState }));
		applySpeakerMute(); // Applies mute to the element
		console.log(`[CallService] Speaker muted: ${newState}`);
	};

	const disconnect = async (): Promise<void> => {
		console.log('[CallService] Disconnecting...');
		if (activeSession || incomingInvitation) {
			await hangupOrReject(); // End calls first
		}
		await cleanupUserAgent(); // Unregister, stop UA, reset state
		console.log('[CallService] Disconnected.');
	};

	return {
		state,
		setAudioElement,
		createUserAgent,
		makeCall,
		answerCall,
		hangupOrReject,
		toggleMicrophoneMute,
		toggleSpeakerMute,
		disconnect
	};
};

export type CallServiceApi = ReturnType<typeof createCallService>;
