// src/lib/config/box.ts
// Box-specific values, read at runtime from /box.json (on the Kiezbox: DEPLOY_PATH/box.json, placed
// by the image overlay), so one app build fits every box. Readable by every phone on the box's
// WLAN, so never put credentials there. Without the file the build-time PUBLIC_* values are used.
import {
	PUBLIC_API_URL,
	PUBLIC_KB_DEMO_TARGET_URI,
	PUBLIC_KB_TARGET_URI,
	PUBLIC_LOG_LEVEL
} from '$env/static/public';
import type { BoxConfig, LogLevel } from '$lib/types';

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'log', 'warn', 'error'];

const logLevel = (value: unknown, fallback: LogLevel): LogLevel =>
	LOG_LEVELS.includes(value as LogLevel) ? (value as LogLevel) : fallback;

let box: BoxConfig = {
	apiUrl: PUBLIC_API_URL,
	targetUri: PUBLIC_KB_TARGET_URI,
	demoTargetUri: PUBLIC_KB_DEMO_TARGET_URI,
	logLevel: logLevel(PUBLIC_LOG_LEVEL, 'error')
};

const nonEmpty = (value: unknown, fallback: string) =>
	typeof value === 'string' && value.trim() ? value : fallback;

/** Only absolute http(s) URLs, without trailing slash (apiFetch appends paths like /api/mode) */
const validUrl = (value: unknown, fallback: string) => {
	if (typeof value !== 'string' || !value.trim()) return fallback;
	try {
		const url = new URL(value.trim());
		if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(url.protocol);
		return value.trim().replace(/\/+$/, '');
	} catch {
		console.warn('Ignoring invalid apiUrl in /box.json:', value);
		return fallback;
	}
};

/** Never rejects: a missing or invalid /box.json just keeps the build-time values */
export async function loadBox(): Promise<BoxConfig> {
	try {
		const response = await fetch('/box.json');
		if (response.ok) {
			// May be index.html if the webserver falls back to the SPA, then json() throws
			const data = (await response.json()) as Partial<Record<keyof BoxConfig, unknown>>;
			box = {
				apiUrl: validUrl(data.apiUrl, box.apiUrl),
				targetUri: nonEmpty(data.targetUri, box.targetUri),
				demoTargetUri: nonEmpty(data.demoTargetUri, box.demoTargetUri),
				logLevel: logLevel(data.logLevel, box.logLevel)
			};
		}
	} catch (error) {
		console.warn('Using build-time box values, /box.json not usable:', error);
	}
	return box;
}

export const getBox = (): BoxConfig => box;
