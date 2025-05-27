import { apiFetch } from '$lib/api';
import { createNetworkService, type NetworkServiceApi } from '$lib/services/networkService';
import type { NetworkServiceState } from '$lib/types';

export const NetworkStore = $state({
	networkServiceInstance: null as NetworkServiceApi | null,
	networkState: null as NetworkServiceState | null,
	initialized: false
});

let unsubscribeState: (() => void) | null = $state<(() => void) | null>(null);

/**
 * Initialize the network service singleton
 */
export async function initNetworkService() {
	try {
		if (NetworkStore.initialized && NetworkStore.networkServiceInstance) return;

		if (NetworkStore.networkServiceInstance) {
			await cleanupNetworkService();
		}
		const sipConfigResponse = await apiFetch('/api/sipconfig');
		if (!sipConfigResponse) throw new Error('Empty SIP config');

		const sipConfig = sipConfigResponse as SIPConfig;
		NetworkStore.networkServiceInstance = createNetworkService(sipConfig);

		unsubscribeState = NetworkStore.networkServiceInstance.state.subscribe((newState) => {
			NetworkStore.networkState = newState;
		});

		await NetworkStore.networkServiceInstance.startPing();
		NetworkStore.initialized = true;
		console.log('[NetworkStore] Service NetworkStore.initialized globally');
	} catch (error) {
		throw new Error(`Failed to fetch SIP config: ${error}`);
	}
}

/**
 * Clean up the network service singleton
 */
export async function cleanupNetworkService() {
	if (!NetworkStore.networkServiceInstance) return;
	await NetworkStore.networkServiceInstance.stopPing();

	if (unsubscribeState) {
		unsubscribeState();
		unsubscribeState = null;
	}

	// Reset values
	NetworkStore.initialized = false;
}
