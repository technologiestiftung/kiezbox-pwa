import type { RegistererState } from 'sip.js';

export interface KiezboxConfig {
	kbServerAddress: string;
	kbWSSPort: number;
	kbWSSPath: string;
	kbDomain: string;
	kbSIPUsername: string;
	kbSIPPassword: string;
	kbDisplayName: string;
	kbTargetUri: string;
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
	CALL_TERMINATED = 'CALL_TERMINATED',
	CALL_FAILED = 'CALL_FAILED',
	CALL_REJECTED = 'CALL_REJECTED',
	CALL_REDIRECTED = 'CALL_REDIRECTED'
}

export const assignStream = (
	stream: MediaStream,
	element: HTMLMediaElement | null,
	setError: (string: string) => void
) => {
	if (!element) {
		setError('No audio element available to assign stream.');
		return;
	}
	// Set element source.
	element.autoplay = true;
	element.srcObject = stream;

	// Load and start playback of media.
	element.play().catch((error: Error) => {
		// setError(`Failed to play remote media: ${error.message}`);
		console.error('Failed to play remote media');
		console.error(error);
	});

	stream.onaddtrack = (): void => {
		element.load();
		element.play().catch((error: Error) => {
			setError(`Failed to play remote media on add track: ${error.message}`);
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
