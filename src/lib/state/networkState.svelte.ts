import { apiFetch } from '$lib/api';
import type { Mode } from '$lib/types';
import { ApiStatus, DeviceType } from '$lib/enums';
import { goto } from '$app/navigation';
import type { LngLatLike } from 'maplibre-gl';
import { PUBLIC_WSS_PATH } from '$env/static/public';

// Constants
const PING_API_ENDPOINT = '/api/mode';
const INFO_API_ENDPOINT = '/api/info';
const PING_INTERVAL_MS = 15000;

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
	deviceType: DeviceType.DESKTOP as DeviceType,
	adminMode: false,
	coordinates: null as LngLatLike | null,
	initialized: false
});

const setError = (message: string | null): void => {
	console.log(message);
	NetworkStore.errorMessage = message;
	if (message) {
		console.error(`[NetworkService] Error state set: ${message}`);
	}
};

const isCaptivePortalCheck = async (): Promise<boolean> => {
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

	const isLocalhost = window.location.hostname === 'localhost';
	const host = isLocalhost ? 'emergency.ds-apps.tsb-berlin.de' : window.location.host;
	const kbWSS = `wss://${host}${PUBLIC_WSS_PATH}`;

	return new Promise<boolean>((resolve) => {
		let resolved = false;

		try {
			const ws = new WebSocket(kbWSS, ['sip']);
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

		// const infoResponse: any = await apiFetch(INFO_API_ENDPOINT, {
		// 	method: 'GET',
		// 	headers: { 'Content-Type': 'application/json' }
		// });
		// console.log('Info response:', infoResponse);

		// const lngLat: LngLatLike = [infoResponse.lon, infoResponse.lat];

		return {
			status: response.mode,
			isEmergency: response.mode % 2 == 0,
			coordinates: response.coordinates || [13.342502830765682, 52.48863888739753]
		};
	} catch (error) {
		setError(`Failed to fetch mode: ${error instanceof Error ? error.message : String(error)}`);
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
		const mode: Mode | null = await fetchMode();
		if (!mode) {
			NetworkStore.apiStatus = ApiStatus.UNAVAILABLE;
			NetworkStore.mode = null;
			NetworkStore.errorMessage = 'network';
			return;
		}

		const captivePortalDetected = await isCaptivePortalCheck();
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
		NetworkStore.coordinates = mode.coordinates;
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
}

export function setAdminMode(isAdmin: boolean) {
	NetworkStore.adminMode = isAdmin;
	return NetworkStore.adminMode;
}

export function toggleMode() {
	NetworkStore.mode = {
		status: NetworkStore.mode?.status === 0 ? 1 : 0,
		isEmergency: !NetworkStore.mode?.isEmergency,
		coordinates: [13.342502830765682, 52.48863888739753]
	};
	console.log(`Toggling mode to: ${NetworkStore.mode.status}`);

	try {
		const response = apiFetch('/api/admin/setMode', {
			method: 'POST',
			body: JSON.stringify({ mode: !NetworkStore.mode?.status }),
			headers: { 'Content-Type': 'application/json' }
		});
		return response;
	} catch (error) {
		setError(`Failed to toggle mode: ${error instanceof Error ? error.message : String(error)}`);
	}
}
