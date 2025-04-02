import { PUBLIC_LOG_LEVEL } from '$env/static/public';
import {
	Invitation,
	Inviter,
	Registerer,
	RegistererState,
	Session,
	SessionState,
	UserAgent,
	Web,
	type InviterInviteOptions,
	type LogLevel,
	type UserAgentDelegate
	// Add these imports for Logger
} from 'sip.js';
import type { IncomingResponse, OutgoingRequestDelegate } from 'sip.js/lib/core';
import { get, readable, writable, type Readable } from 'svelte/store';
import { assignStream, CallState, type CallServiceState, type KiezboxConfig } from './callUtils';

export const createCallService = (config: KiezboxConfig) => {
	let remoteAudioElement: HTMLAudioElement | null = null;
	let userAgent: UserAgent | null = null;
	let registerer: Registerer | null = null;
	let activeSession: Session | Inviter | null = null;
	let incomingInvitation: Invitation | null = null;
	let callTimerInterval: ReturnType<typeof setInterval> | null = null;
	let callStartTime: number | null = null;

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

	const state: Readable<CallServiceState> = readable(get(_state), (set) => {
		const unsubscribe = _state.subscribe(set);
		return () => unsubscribe();
	});

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
	};

	const startCallTimer = (): void => {
		stopCallTimer();
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
		_state.update((s) => ({
			...s,
			callState: CallState.CALL_TERMINATED,
			callerId: null,
			callDuration: 0,
			remoteStream: null,
			isMicrophoneMuted: false,
			isSpeakerMuted: false
		}));

		if (remoteAudioElement) {
			remoteAudioElement.srcObject = null;
		}
	};

	const cleanupUserAgent = async (): Promise<void> => {
		// Unregister
		if (registerer && get(_state).registererState === RegistererState.Registered) {
			try {
				await registerer.unregister();
				// Stop UserAgent
				if (userAgent) {
					const uaToStop = userAgent;
					userAgent = null; // Clear ref
					if (uaToStop.isConnected()) {
						await uaToStop.stop();
					}
				}
			} catch (error: unknown) {
				setError(`Failed to unregister: ${error}`);
			} finally {
				registerer = null;
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
			}
		}
	};

	const register = async () => {
		try {
			if (!userAgent) {
				setError('UserAgent not available for registration.');
				return;
			}
			registerer = new Registerer(userAgent);
			registerer.stateChange.addListener((newState: RegistererState) => {
				_state.update((s) => ({ ...s, registererState: newState }));
			});

			await registerer.register();
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Registration error: ${error.message}`);
				_state.update((s) => ({ ...s, registererState: RegistererState.Terminated }));
				registerer = null;
			}
		}
	};

	const userAgentDelegate: UserAgentDelegate = {
		onConnect: () => {
			_state.update((s) => ({ ...s, callState: CallState.CONNECTED }));
			setError(null); // Clear connection errors
			register(); // Attempt registration
		},

		onDisconnect: (error: Error) => {
			_state.update((s) => ({
				...s,
				callState: CallState.DISCONNECTED,
				registererState: RegistererState.Terminated
			}));
			setError(`Disconnected: ${error.message}`);
			cleanupSession(); // Call ends on disconnect
		},
		onInvite: (invitation: Invitation) => {
			if (activeSession) {
				invitation.reject({ statusCode: 486 });
				setError('Call rejected: Already in another call.');
				return;
			}
			console.log('[CallService] Incoming call:', invitation);
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
			cleanupSession(); // Cleanup old one first
		}

		if (session instanceof Session) {
			activeSession = session;
			_state.update((s) => ({ ...s, isMicrophoneMuted: false, isSpeakerMuted: false }));
			applySpeakerMute();
		}

		session.stateChange.addListener((newState: SessionState) => {
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
					assignStream(sessionDescriptionHandler.remoteMediaStream, remoteAudioElement, setError);
				}
			} else if (newState === SessionState.Terminated) {
				cleanupSession(session);
			} else if (newState === SessionState.Terminating) {
				setError('Call is terminating...');
				_state.update((s) => ({ ...s, callState: CallState.CALL_TERMINATED }));
				console.log('[CallService] Session terminating...');
			}
		});
	};

	const setAudioElement = (element: HTMLAudioElement): void => {
		remoteAudioElement = element;
		applySpeakerMute();
	};

	const createUserAgent = async (): Promise<void> => {
		if (userAgent && get(_state).callState !== CallState.DISCONNECTED) {
			return;
		}
		clearError();

		try {
			const kbWSS = `wss://${config.kbServerAddress}:${config.kbWSSPort}${config.kbWSSPath}`;
			const kbURI = `sip:${config.kbSIPUsername}@${config.kbDomain}`;
			const uri = UserAgent.makeURI(kbURI);
			if (!uri) throw new Error(`Failed to create URI from ${kbURI}`);

			userAgent = new UserAgent({
				uri: uri,
				transportOptions: { server: kbWSS, connectionTimeout: 100, keepAliveInterval: 300 },
				logLevel: (PUBLIC_LOG_LEVEL as LogLevel) || 'error',
				authorizationUsername: config.kbSIPUsername,
				authorizationPassword: config.kbSIPPassword,
				displayName: config.kbDisplayName,
				delegate: userAgentDelegate
			});
			await userAgent.start();
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Failed to connect: ${error.message || error}`);
				await cleanupUserAgent(); // Cleanup on failure
			}
		}
	};

	const outgoingRequestDelegate: OutgoingRequestDelegate = {
		onAccept: () => {
			_state.update((s) => ({ ...s, callState: CallState.CALL_ESTABLISHED }));
			startCallTimer(); // Start call timer on established
		},
		onReject: () => {
			_state.update((s) => ({ ...s, callState: CallState.CALL_REJECTED }));
			cleanupSession(); // Cleanup on reject
		},
		onRedirect: (response: IncomingResponse) => {
			setError(`Call redirected: ${response.message}`);
			_state.update((s) => ({ ...s, callState: CallState.CALL_REDIRECTED }));
			cleanupSession(); // Cleanup on redirect
		},
		onTrying: () => {
			_state.update((s) => ({ ...s, callState: CallState.CALLING }));
			console.log('[CallService] Call is trying...');
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
			const inviterOptions: InviterInviteOptions = {
				sessionDescriptionHandlerOptions: {
					constraints: { audio: true, video: false }
				},
				requestDelegate: outgoingRequestDelegate
			};
			const inviter = new Inviter(userAgent, target);
			setupSession(inviter);
			activeSession = inviter;
			_state.update((s) => ({ ...s, callState: CallState.CALLING }));
			await inviter.invite(inviterOptions);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Failed to make call: ${error.message || error}`);
			} else {
				setError(`Failed to make call: ${error}`);
			}
			cleanupSession(); // Cleanup failed call attempt
		}
	};

	const answerCall = async (): Promise<void> => {
		console.log(
			'[CallService] Answering call...',
			`Incoming call from: ${incomingInvitation?.remoteIdentity.displayName || ''}`
		);
		console.log('[CallService] Incoming call:', incomingInvitation);
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
			_state.update((s) => ({ ...s, callState: CallState.CALL_INCOMING, callerId: null })); // Update UI state
			await invitationToAccept.accept(acceptOptions);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setError(`Failed to answer call: ${error.message || error}`);
				cleanupSession(); // Cleanup if accept fails
				_state.update((s) => ({ ...s, isIncomingCall: false, callerId: null }));
			}
		}
	};

	const hangupOrReject = async (): Promise<void> => {
		clearError();
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
				_state.update((s) => ({ ...s, callState: CallState.CALL_TERMINATED, callerId: null }));
			}
		} else if (activeSession) {
			const sessionToTerminate = activeSession;
			const state = sessionToTerminate.state;
			activeSession = null;

			try {
				if (state === SessionState.Terminated || state === SessionState.Terminating) {
					return;
				} else if (state === SessionState.Initial && sessionToTerminate instanceof Inviter) {
					await sessionToTerminate.cancel();
				} else {
					await sessionToTerminate.bye();
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					setError(`Failed to hangup/cancel: ${error.message || error}`);
				} else {
					setError(`Failed to hangup/cancel: ${error}`);
				}
			} finally {
				cleanupSession(sessionToTerminate);
			}
		} else {
			setError('No active call to hangup or reject.');
		}
	};

	const toggleMicrophoneMute = (): void => {
		if (!activeSession || get(_state).callState !== CallState.CALL_ESTABLISHED) {
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

	const toggleSpeakerMute = (): void => {
		const newState = !get(_state).isSpeakerMuted;
		_state.update((s) => ({ ...s, isSpeakerMuted: newState }));
		applySpeakerMute();
	};

	const disconnect = async (): Promise<void> => {
		if (activeSession || incomingInvitation) {
			await hangupOrReject(); // End calls first
		}
		await cleanupUserAgent(); // Unregister, stop UA, reset state
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
