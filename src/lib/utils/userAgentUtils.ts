import { Inviter, UserAgent } from 'sip.js';

const config = {
	uri: 'sip:luisebr@sip.linphone.org',
	transportOptions: {
		wsServers: ['wss://edge.sip.onsip.com']
	}
	// authorizationUser: '',
	// password: ''
};
export const createUserAgent = async (): Promise<UserAgent | undefined> => {
	try {
		const userAgent = new UserAgent({
			// uri: UserAgent.makeURI(config.uri),
			transportOptions: {
				server: config.transportOptions.wsServers[0]
			}
			// authorizationPassword: config.password,
			// authorizationUsername: config.authorizationUser
		});
		if (!userAgent) {
			throw new Error('UserAgent not defined.');
		}
		await userAgent.start();
		console.log('[UserAgentCall] userAgent::', userAgent);
		return userAgent;
	} catch (error) {
		console.error('Fehler beim Connecten:', error);
		throw error;
	}
};

export const makeCall = async (userAgent: UserAgent): Promise<Inviter | null> => {
	try {
		if (!userAgent) {
			throw new Error('UserAgent not defined.');
		}
		// Set target destination
		const target = UserAgent.makeURI('sip:echo@sipjs.onsip.com');
		if (!target) {
			throw new Error('Failed to create target URI.');
		}
		const inviter = new Inviter(userAgent, target, {
			sessionDescriptionHandlerOptions: {
				constraints: { audio: true, video: false }
			}
		});
		if (!inviter) {
			throw new Error('Failed to create Inviter.');
		}
		await inviter.invite();
		return inviter;
	} catch (error) {
		console.error('Fehler beim Anrufen:', error);
		throw error;
	}
	// Handle outgoing session state changes
	// inviter.stateChange.addListener((newState) => {
	// 	switch (newState) {
	// 		case SessionState.Establishing:
	// 			// Session is establishing

	// 			break;
	// 		case SessionState.Established:
	// 			// Session has been established
	// 			isInCall = true;
	// 			break;
	// 		case SessionState.Terminated:
	// 			// Session has terminated
	// 			isInCall = false;
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// });
};

export const endCall = async (inviter: Inviter): Promise<void> => {
	try {
		if (!inviter) {
			throw new Error('Inviter not defined.');
		}
		await inviter.bye();
	} catch (error) {
		console.error('Fehler beim Auflegen:', error);
		throw error;
	}
};

export const hangUp = async (userAgent: UserAgent): Promise<void> => {
	try {
		if (!userAgent) {
			throw new Error('UserAgent not defined.');
		}
		await userAgent.stop();
	} catch (error) {
		console.error('Fehler beim Auflegen:', error);
		throw error;
	}
};
