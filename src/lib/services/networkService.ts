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
const PING_INTERVAL_MS = 5000;

export const createNetworkService = (config: SIPConfig) => {
	const _state = writable<NetworkServiceState>({
		isCaptivePortal: false,
		errorMessage: null,
		apiStatus: ApiStatus.UNAVAILABLE,
		lastPingTime: null,
		mode: null,
		coordinates: []
	});

	let pingIntervalId: ReturnType<typeof setInterval> | null = null;

	const state: Readable<NetworkServiceState> = readable(get(_state), (set) => {
		const unsubscribe = _state.subscribe(set);
		return () => unsubscribe();
	});

	const setError = (message: string | null): void => {
		_state.update((s) => ({ ...s, errorMessage: message }));
		if (message) {
			console.error(`[NetworkService] Error state set: ${message}`);
		}
	};

	const isCaptivePortal = async (): Promise<boolean> => {
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
			setError(`Failed to fetch mode: ${error instanceof Error ? error.message : String(error)}`);
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
			goto('/', {
				noScroll: true
			});
		} catch (error) {
			setError(`Failed to set me free: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	const fetchSipConfig = async (): Promise<any> => {
		try {
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

	const pingApi = async () => {
		try {
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
		} catch (error: unknown) {
			setError(`Ping API error: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	const startPing = async () => {
		if (pingIntervalId !== null) {
			clearInterval(pingIntervalId);
			pingIntervalId = null;
		}
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
		if (pingIntervalId !== null) {
			clearInterval(pingIntervalId);
			pingIntervalId = null;
		}
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
