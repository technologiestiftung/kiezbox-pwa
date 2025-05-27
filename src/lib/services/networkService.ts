/* eslint-disable @typescript-eslint/no-explicit-any */
// Network Service for KiezBox PWA
// Handles network connectivity, captive portal detection, and permissions management
import { writable, readable, get, type Readable } from 'svelte/store';
import { apiFetch } from '$lib/api';
import type { Mode, NetworkServiceState } from '$lib/types';
import { ApiStatus } from '$lib/enums';
import { goto } from '$app/navigation';

const PING_API_ENDPOINT = '/api/mode';
const SIP_API_ENDPOINT = '/api/sipconfig';
const PING_INTERVAL_MS = 5000; // 10 seconds

export const createNetworkService = (config: SIPConfig) => {
	const _state = writable<NetworkServiceState>({
		isCaptivePortal: false,
		errorMessage: null,
		apiStatus: ApiStatus.UNAVAILABLE,
		lastPingTime: null,
		mode: null,
		coordinates: []
	});

	// Declare interval ID at instance level
	let pingIntervalId: ReturnType<typeof setInterval> | null = null;

	const state: Readable<NetworkServiceState> = readable(get(_state), (set) => {
		const unsubscribe = _state.subscribe(set);
		return () => unsubscribe();
	});

	// const setError = (message: string | null): void => {
	// 	_state.update((s) => ({ ...s, errorMessage: message }));
	// 	if (message) {
	// 		console.error(`[NetworkService] Error state set: ${message}`);
	// 	}
	// };
	const isCaptivePortal = async (): Promise<boolean> => {
		const ua = navigator.userAgent;

		// Heuristic: known captive browser identifiers
		const isCaptiveShell =
			/Captive/.test(ua) ||
			/CaptiveNetworkSupport/.test(ua) ||
			/MiniBrowser/.test(ua) ||
			/NetworkDiagnostics/.test(ua) ||
			/CaptivePortalLogin/.test(ua) ||
			/\bwv\b/.test(ua); // Android WebView

		if (isCaptiveShell) {
			console.warn('User agent indicates captive shell.');
			return true;
		}

		// Secure context is required for camera/mic access
		if (!window.isSecureContext) {
			console.warn('Not in secure context. Likely captive portal.');
			return true;
		}

		// Try using mediaDevices to confirm access
		if (navigator.mediaDevices?.getUserMedia) {
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				return false;
			} catch (err) {
				console.warn('mediaDevices.getUserMedia failed:', err);
				// Continue to fallback test
			}
		} else {
			console.warn('mediaDevices.getUserMedia not available.');
			return true;
		}

		// Fallback: try WebSocket to your backend
		const sipWsUrl = `wss://${config.kbServerAddress}${config.kbWSSPath}`;

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

	// const supportsAudioRecording = async (): Promise<boolean> => {
	// 	try {
	// 		const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia;
	// 		if (!hasMediaDevices) return false;

	// 		const { state } = await navigator.permissions.query({
	// 			name: 'microphone' as PermissionName
	// 		});

	// 		if (state === 'denied') return false;

	// 		try {
	// 			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	// 			stream.getTracks().forEach((track) => track.stop());
	// 			return true;
	// 		} catch (error) {
	// 			console.error('Error accessing microphone:', error);

	// 			return false;
	// 		}
	// 	} catch (error) {
	// 		console.error('Error checking audio recording support:', error);

	// 		return false;
	// 	}
	// };

	const fetchMode = async (): Promise<Mode | null> => {
		try {
			const response: any = await apiFetch(PING_API_ENDPOINT, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response && !response.mode) {
				throw new Error(`API request failed with status: ${response.mode}`);
			}
			console.log(response);
			return {
				status: response.mode,
				isEmergency: response.mode % 2 == 0
			};
		} catch (error) {
			console.error('Error fetching mode:', error);
			return null;
		}
	};

	const setMeFree = async (): Promise<void> => {
		try {
			const response: any = await apiFetch('/captive-portal/api/setmefree', {
				method: 'GET'
			});
			if (!response) {
				throw new Error(`Set me free request failed with status: ${response.status}`);
			}
			console.log(response);
			console.log('Set me free response:', response);

			goto('/', {
				noScroll: true
			});
		} catch (error) {
			console.error('Error setting me free:', error);
			throw new Error(
				`Failed to set me free: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	};

	const fetchSipConfig = async (): Promise<any> => {
		try {
			const response: any = await apiFetch(SIP_API_ENDPOINT, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			console.log('SIP config response:', response);

			if (!response) {
				throw new Error(`SIP config request failed with status: ${response}`);
			}

			return response;
		} catch (error) {
			console.error('Error fetching SIP config:', error);
			return null;
		}
	};

	const pingApi = async () => {
		let currentError: string | null = null;
		try {
			// Check for captive portal first

			const mode: Mode | null = await fetchMode();
			if (!mode) {
				_state.update((s) => ({
					...s,
					apiStatus: ApiStatus.UNAVAILABLE,
					errorMessage: 'network'
				}));
				return;
			}

			const sipConfig = await fetchSipConfig();
			if (!sipConfig) {
				_state.update((s) => ({
					...s,
					apiStatus: ApiStatus.UNAVAILABLE,
					errorMessage: 'network'
				}));
				return;
			}

			const captivePortalDetected = await isCaptivePortal();
			if (captivePortalDetected) {
				_state.update((s) => ({
					...s,
					isCaptivePortal: true,
					apiStatus: ApiStatus.UNAVAILABLE,
					errorMessage: 'captive-portal'
				}));
				return;
			}

			// const hasAudioSupport = await supportsAudioRecording();
			// if (!hasAudioSupport) {
			// 	_state.update((s) => ({
			// 		...s,
			// 		errorMessage: 'audio'
			// 	}));
			// 	return;
			// }

			const now = new Date();
			_state.update((s) => ({
				...s,
				isCaptivePortal: false,
				lastPingTime: now,
				lastChecked: now,
				apiStatus: ApiStatus.AVAILABLE,
				errorMessage: null,
				mode: mode
			}));
		} catch (err: unknown) {
			if (err instanceof Error) {
				currentError = err.message;
				console.error('Error fetching mode:', err);
			} else {
				currentError = String(err);
				console.error('Error fetching mode:', err);
			}

			_state.update((s) => ({
				...s,
				errorMessage: currentError
			}));
		}
	};

	const startPing = async () => {
		// Clear any existing interval first to prevent multiple pings
		if (pingIntervalId !== null) {
			clearInterval(pingIntervalId);
			pingIntervalId = null;
		}

		// Start a new ping cycle
		await pingApi();
		pingIntervalId = setInterval(pingApi, PING_INTERVAL_MS);

		return () => {
			if (pingIntervalId !== null) {
				clearInterval(pingIntervalId);
				pingIntervalId = null;
			}
		};
	};

	const stopPing = async () => {
		// Clear the existing interval
		if (pingIntervalId !== null) {
			clearInterval(pingIntervalId);
			pingIntervalId = null;
		}

		// Update state
		_state.update((s) => ({ ...s, apiStatus: ApiStatus.UNAVAILABLE, lastPingTime: null }));
	};

	return {
		state,
		pingApi,
		startPing,
		stopPing,
		setMeFree
	};
};

export type NetworkServiceApi = ReturnType<typeof createNetworkService>;
