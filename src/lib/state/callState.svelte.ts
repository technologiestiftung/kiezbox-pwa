import { createCallService, type CallServiceApi } from '$lib/services/callService';
import type { CallServiceState } from '$lib/types';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SIPConfig = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SIPUser = any;

// Create a container object that will hold the state
// This object itself won't be reassigned, only its properties
export const CallStore = $state({
	instance: null as CallServiceApi | null,
	state: null as CallServiceState | null,
	initialized: false
});

// Private state for subscription management
let unsubscribeState: (() => void) | null = $state<(() => void) | null>(null);

/**
 * Initialize the call service singleton
 * @param config SIP configuration
 * @param audioElement Remote audio element
 */
export async function initCallService(config: SIPConfig, audioElement: HTMLAudioElement) {
	if (!audioElement) {
		throw new Error('Audio element is required for call service initialization');
	}

	// Clean up any existing instance
	if (CallStore.instance) {
		await cleanupCallService();
	}

	// Create a new call service instance
	CallStore.instance = createCallService(config);

	// Set audio element
	CallStore.instance.setAudioElement(audioElement);

	// Subscribe to state changes
	unsubscribeState = CallStore.instance.state.subscribe((newState) => {
		CallStore.state = newState;
	});

	CallStore.initialized = true;
	console.log('[CallStore] Service initialized globally');
}

/**
 * Create a user agent for SIP communication
 * @param sipUser SIP user credentials
 */
export async function createUserAgent(sipUser: SIPUser) {
	if (!CallStore.instance) {
		throw new Error('Call service not initialized');
	}

	await CallStore.instance.createUserAgent(sipUser);
}

/**
 * Clean up the call service singleton
 */
export async function cleanupCallService() {
	if (!CallStore.instance) return;

	// Disconnect the call service
	await CallStore.instance.disconnect();

	// Unsubscribe from state changes
	if (unsubscribeState) {
		unsubscribeState();
		unsubscribeState = null;
	}

	// Reset values
	CallStore.initialized = false;
	CallStore.state = null;
	CallStore.instance = null;
}
