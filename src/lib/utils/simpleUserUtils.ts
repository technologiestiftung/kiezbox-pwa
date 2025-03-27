import { PUBLIC_SIP_TARGET, PUBLIC_WSS_SERVER } from '$env/static/public';
import { Inviter, Web } from 'sip.js';
import { SimpleUser, type SimpleUserDelegate } from 'sip.js/lib/platform/web';

const webSocketServer = PUBLIC_WSS_SERVER;
const target = PUBLIC_SIP_TARGET;

export const createSimpleUser = async (
	simpleUserDelegate: SimpleUserDelegate,
	remoteAudio: HTMLAudioElement,
	displayName: string
): Promise<SimpleUser | undefined> => {
	try {
		const simpleUser = new Web.SimpleUser(webSocketServer, {
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

export const call = async (simpleUser: SimpleUser): Promise<void> => {
	try {
		if (!simpleUser) {
			throw new Error('SimpleUser not defined.');
		}

		return await simpleUser.call(target, { inviteWithoutSdp: false });
	} catch (error) {
		console.error('Fehler beim Anrufen:', error);
		throw error;
	}
};

export const end = async (inviter: Inviter): Promise<void> => {
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

export const hangCall = async (simpleUser: SimpleUser): Promise<void> => {
	try {
		if (!simpleUser) {
			throw new Error('SimpleUser not defined.');
		}
		// await simpleUser.hangup();
		await simpleUser.disconnect();
	} catch (error) {
		console.error('Fehler beim Auflegen:', error);
		throw error;
	}
};
