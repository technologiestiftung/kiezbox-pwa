import {
	UserAgent,
	Inviter,
	Session,
	SessionState,
	type UserAgentDelegate,
	type SessionDelegate,
	Registerer
} from 'sip.js';
import type { KiezboxConfig } from './callService';

/*
 * Creates and starts a sip.js UserAgent.
 * @param kbConfig Configuration for the UserAgent.
 * @returns The created and started UserAgent instance, or undefined on failure.
 */
export const createUserAgent = async (
	kbConfig: KiezboxConfig,
	delegate: UserAgentDelegate
): Promise<UserAgent | undefined> => {
	console.log('[UserAgentService] Creating UserAgent with config:', kbConfig);
	try {
		const kbWSS = `wss://${kbConfig.kbServerAddress}:${kbConfig.kbWSSPort}${kbConfig.kbWSSPath}`;
		const kbURI = `sip:${kbConfig.kbSIPUsername}@${kbConfig.kbDomain}`;

		const uri = UserAgent.makeURI(kbURI);
		if (!uri) {
			throw new Error(`Failed to create URI from ${kbURI}`);
		}

		console.log(`[UserAgentService] kbWSS: ${kbWSS}`);
		console.log(`[UserAgentService] kbURI: ${kbURI}`);

		const userAgent = new UserAgent({
			uri: uri,
			transportOptions: {
				server: kbWSS,
				connectionTimeout: 50, // Example: 5 seconds
				keepAliveInterval: 300 // Example: 30 seconds
			},
			logLevel: 'debug',
			authorizationUsername: kbConfig.kbSIPUsername,
			authorizationPassword: kbConfig.kbSIPPassword,
			delegate: delegate
			// sessionDescriptionHandlerFactoryOptions: {
			// 	peerConnectionOptions: {
			// 		iceServers: []
			// 	}
			// }
		});

		console.log('[UserAgentService] Starting UserAgent...');
		console.log(`[UserAgentService] kbWSS: ${kbWSS}`);
		await userAgent.start(); // Connects the transport
		if (!userAgent.isConnected()) {
			throw new Error('UserAgent failed to connect.');
		}

		const registerer = new Registerer(userAgent);
		await registerer.register();
		console.log('[UserAgentService] UserAgent started successfully.');
		return userAgent;
	} catch (error) {
		console.error('[UserAgentService] Error creating/starting UserAgent:', error);
		return undefined;
	}
};

/**
 * Creates an Inviter (outgoing call session) using a UserAgent.
 * @param userAgent The UserAgent instance to use.
 * @param targetUri The SIP URI to call.
 * @returns The created Inviter session, or null on failure.
 */
export const createInviter = async (
	userAgent: UserAgent,
	targetUri: string,
	sessionDelegate?: SessionDelegate
): Promise<Inviter | null> => {
	console.log(`[UserAgentService] Inviting target: ${targetUri}`);
	try {
		if (!userAgent || !userAgent.isConnected()) {
			throw new Error('UserAgent not defined or not connected.');
		}
		const target = UserAgent.makeURI(targetUri);
		if (!target) {
			throw new Error(`Failed to create target URI from ${targetUri}.`);
		}

		console.log(`[UserAgentService] Target URI: ${target}`);

		const inviter = new Inviter(userAgent, target, {
			sessionDescriptionHandlerOptions: {
				constraints: { audio: true, video: false }
			},
			delegate: sessionDelegate
		});

		console.log(`[UserAgentService] Sending INVITE for session ${inviter.id}`);
		return inviter;
	} catch (error) {
		console.error('[UserAgentService] Error creating/inviting:', error);
		return null;
	}
};

/**
 * Terminates an active SIP session (Inviter or incoming Session).
 * @param session The session to terminate.
 */
export const terminateSession = async (session: Inviter | Session | undefined): Promise<void> => {
	if (!session) {
		console.warn('[UserAgentService] terminateSession called with undefined session.');
		return;
	}
	try {
		const currentState = session.state;
		if (currentState === SessionState.Terminated || currentState === SessionState.Terminating) {
			console.log(`[UserAgentService] Session ${session.id} already terminating/terminated.`);
			return;
		}
		console.log(`[UserAgentService] Terminating session ${session.id} in state ${currentState}`);
		await session.bye();
	} catch (error) {
		console.error(`[UserAgentService] Error terminating session ${session.id}:`, error);
	}
};

/**
 * Stops the UserAgent, disconnecting its transport and cleaning up resources.
 * @param userAgent The UserAgent instance to stop.
 */
export const stopUserAgent = async (userAgent: UserAgent | undefined): Promise<void> => {
	if (!userAgent) {
		console.warn('[UserAgentService] stopUserAgent called with undefined UserAgent.');
		return;
	}
	try {
		if (userAgent.isConnected()) {
			console.log('[UserAgentService] Stopping UserAgent...');
			await userAgent.stop();
			console.log('[UserAgentService] UserAgent stopped.');
		} else {
			console.log('[UserAgentService] UserAgent already stopped/disconnected.');
		}
	} catch (error) {
		console.error('[UserAgentService] Error stopping UserAgent:', error);
	}
};
