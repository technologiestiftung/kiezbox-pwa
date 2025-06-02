import { apiFetch } from '$lib/api';
import type { Mode } from '$lib/types';
import { ApiStatus } from '$lib/enums';
import { goto } from '$app/navigation';
import type { LngLatLike } from 'maplibre-gl';

// Constants
const PING_API_ENDPOINT = '/api/mode';
const SIP_API_ENDPOINT = '/api/sipconfig';
const PING_INTERVAL_MS = 5000;

let pingIntervalId: ReturnType<typeof setInterval> | null = $state<ReturnType<
	typeof setInterval
> | null>(null);

// Create the centralized store
export const NetworkStore = $state({
	// Core state properties
	isCaptivePortal: false,
	errorMessage: null as string | null,
	apiStatus: ApiStatus.UNAVAILABLE,
	lastPingTime: null as Date | null,
	mode: null as Mode | null,
	config: null as SIPConfig | null,
	coordinates: [0, 0] as LngLatLike,
	initialized: false
});

const setError = (message: string | null): void => {
	NetworkStore.errorMessage = message;
	if (message) {
		console.error(`[NetworkService] Error state set: ${message}`);
	}
};

const isCaptivePortalCheck = async (sipConfig: SIPConfig): Promise<boolean> => {
	const ua = navigator.userAgent;

	const isCaptiveShell =
		/Captive/.test(ua) ||
		/CaptiveNetworkSupport/.test(ua) ||
		/MiniBrowser/.test(ua) ||
		/NetworkDiagnostics/.test(ua) ||
		/CaptivePortalLogin/.test(ua) ||
		/\bwv\b/.test(ua);

	if (isCaptiveShell) {
		console.warn('User agent indicates captive shell.');
		return true;
	}

	if (!window.isSecureContext) {
		console.warn('Not in secure context. Likely captive portal.');
		return true;
	}

	if (navigator.mediaDevices?.getUserMedia) {
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
			return false;
		} catch (error) {
			setError(`Media access error: ${error instanceof Error ? error.message : String(error)}`);
		}
	} else {
		console.warn('mediaDevices.getUserMedia not available.');
		return true;
	}

	const sipWsUrl = `wss://${sipConfig.kbServerAddress}${sipConfig.kbWSSPath}`;

	return new Promise<boolean>((resolve) => {
		let resolved = false;

		try {
			const ws = new WebSocket(sipWsUrl, ['sip']);
			ws.onopen = () => {
				if (!resolved) {
					resolved = true;
					ws.close();
					resolve(false);
				}
			};

			ws.onerror = () => {
				if (!resolved) {
					resolved = true;
					resolve(true);
				}
			};

			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					resolve(true);
				}
			}, 3000);
		} catch (error) {
			console.error('WebSocket exception:', error);
			resolve(true);
		}
	});
};

/**
 * Fetch mode information from the API
 */
const fetchMode = async (): Promise<Mode | null> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response: any = await apiFetch(PING_API_ENDPOINT, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response || typeof response.mode !== 'number') {
			throw new Error(`Invalid mode response: ${JSON.stringify(response)}`);
		}

		return {
			status: response.mode,
			isEmergency: response.mode % 2 == 0
		};
	} catch (error) {
		setError(`Failed to fetch mode: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
};

const fetchCoordinates = async (): Promise<string[] | null> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response: any = await apiFetch('/api/coordinates', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		if (!response || !Array.isArray(response.coordinates)) {
			throw new Error(`Invalid coordinates response: ${JSON.stringify(response)}`);
		}
		return response.coordinates;
	} catch (error) {
		setError(
			`Failed to fetch coordinates: ${error instanceof Error ? error.message : String(error)}`
		);
		return null;
	}
};

/**
 * Fetch SIP configuration from the API
 */
const fetchSipConfig = async (): Promise<SIPConfig | null> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response: any = await apiFetch(SIP_API_ENDPOINT, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response) {
			throw new Error(`SIP config request failed with status: ${response}`);
		}

		return response;
	} catch (error) {
		setError(
			`Failed to fetch SIP config: ${error instanceof Error ? error.message : String(error)}`
		);
		return null;
	}
};

/**
 * Set me free from captive portal
 */
export const setMeFree = async (): Promise<void> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response: any = await apiFetch('/captive-portal/api/setmefree', {
			method: 'GET'
		});

		if (!response) {
			throw new Error(`Set me free request failed with status: ${response.status}`);
		}
		goto('/', {
			noScroll: true
		});
	} catch (error) {
		setError(`Failed to set me free: ${error instanceof Error ? error.message : String(error)}`);
	}
};

/**
 * Ping the API to check connectivity
 */
const pingApi = async () => {
	try {
		const coordinates = await fetchCoordinates();
		if (coordinates) {
			NetworkStore.coordinates = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
		} else {
			const coordinates: LngLatLike = [13.411833, 52.500398];
			NetworkStore.coordinates = coordinates;
		}

		const mode: Mode | null = await fetchMode();
		if (!mode) {
			NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
			NetworkStore.mode = null;
			NetworkStore.errorMessage = 'network';
			return;
		}

		const sipConfig = await fetchSipConfig();
		if (!sipConfig) {
			NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
			NetworkStore.errorMessage = 'network';
			return;
		}

		const captivePortalDetected = await isCaptivePortalCheck(sipConfig);
		if (captivePortalDetected) {
			NetworkStore.isCaptivePortal = true;
			NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
			NetworkStore.errorMessage = 'captive-portal';
			return;
		}

		const now = new Date();
		NetworkStore.isCaptivePortal = false;
		NetworkStore.lastPingTime = now;
		NetworkStore.apiStatus = ApiStatus.AVAILABLE;
		NetworkStore.errorMessage = null;
		NetworkStore.config = sipConfig;
		NetworkStore.mode = mode;
	} catch (error: unknown) {
		setError(`Ping API error: ${error instanceof Error ? error.message : String(error)}`);
	}
};

// PUBLIC API FUNCTIONS

/**
 * Initialize the network service singleton
 */
export async function initNetworkService() {
	try {
		if (NetworkStore.initialized) return;

		await stopPing();
		await pingApi();

		startPing();
		NetworkStore.initialized = true;
		console.log('[NetworkStore] Service initialized globally');
	} catch (error) {
		throw new Error(`Failed to initialize network service: ${error}`);
	}
}

/**
 * Start periodic ping to check network connectivity
 */
export function startPing() {
	if (pingIntervalId !== null) {
		clearInterval(pingIntervalId);
	}

	pingIntervalId = setInterval(pingApi, PING_INTERVAL_MS);
	return () => stopPing();
}

/**
 * Stop periodic ping
 */
export async function stopPing() {
	if (pingIntervalId !== null) {
		clearInterval(pingIntervalId);
		pingIntervalId = null;
	}

	NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
}

/**
 * Clean up the network service singleton
 */
export async function cleanupNetworkService() {
	if (!NetworkStore.initialized) return;

	await stopPing();

	// Reset values
	NetworkStore.initialized = false;
	NetworkStore.isCaptivePortal = false;
	NetworkStore.errorMessage = null;
	NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
	NetworkStore.lastPingTime = null;
	NetworkStore.mode = null;
	NetworkStore.config = null;
}
