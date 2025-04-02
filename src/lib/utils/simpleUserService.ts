import { Web } from 'sip.js';
import { SimpleUser, type SimpleUserDelegate } from 'sip.js/lib/platform/web';

export interface DemoConfig {
	demoWSS: string;
	demoDisplayName: string;
	demoTarget: string;
}

export const createSimpleUser = async (
	simpleUserDelegate: SimpleUserDelegate,
	remoteAudio: HTMLAudioElement,
	demoConfig: DemoConfig
): Promise<SimpleUser | undefined> => {
	try {
		const simpleUser = new Web.SimpleUser(demoConfig.demoWSS, {
			delegate: simpleUserDelegate,
			media: {
				remote: {
					audio: remoteAudio
				}
			},
			userAgentOptions: {
				displayName: demoConfig.demoDisplayName
			}
		});
		if (!simpleUser) {
			throw new Error('Failed to create SimpleUser.');
		}
		await simpleUser.connect();
		return simpleUser;
	} catch (error) {
		console.error('Fehler beim Connecten:', error);
		throw error;
	}
};

export const callSimpleUser = async (
	simpleUser: SimpleUser,
	demoConfig: DemoConfig
): Promise<void> => {
	try {
		if (!simpleUser) {
			throw new Error('SimpleUser not defined.');
		}

		return await simpleUser.call(demoConfig.demoTarget, { inviteWithoutSdp: false });
	} catch (error) {
		console.error('Fehler beim Anrufen:', error);
		throw error;
	}
};

export const disconnectSimpleUser = async (simpleUser: SimpleUser | undefined): Promise<void> => {
	if (!simpleUser) {
		console.warn('disconnectSimpleUser called with undefined SimpleUser.');
		return;
	}
	try {
		// Use hangup() if a call is active, otherwise just disconnect
		if (simpleUser.isConnected()) {
			console.log('Hanging up active SimpleUser call before disconnecting...');
			await simpleUser.hangup(); // End the current call first
		}
		if (simpleUser.isConnected()) {
			console.log('Disconnecting SimpleUser...');
			await simpleUser.disconnect();
		} else {
			console.log('SimpleUser already disconnected.');
		}
	} catch (error) {
		console.error('Fehler beim Trennen des SimpleUser:', error);
		// Don't re-throw
	}
};

// NEW: Function to specifically hangup the current SimpleUser call
export const hangupSimpleUserCall = async (simpleUser: SimpleUser | undefined): Promise<void> => {
	if (!simpleUser) {
		console.warn('hangupSimpleUserCall called with undefined SimpleUser.');
		return;
	}
	if (!simpleUser.isConnected) {
		console.warn('No active SimpleUser call to hangup.');
		return;
	}
	try {
		console.log('Hanging up active SimpleUser call...');
		await simpleUser.hangup();
	} catch (error) {
		console.error('Fehler beim Auflegen des SimpleUser Anrufs:', error);
		// Don't re-throw
	}
};
