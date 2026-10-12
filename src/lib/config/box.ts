// src/lib/config/box.ts
// Box-specific values, read at runtime from /box.json (on the Kiezbox: DEPLOY_PATH/box.json, placed
// by the image overlay), so one app build fits every box. Readable by every phone on the box's
// WLAN, so never put credentials there. Without the file the build-time PUBLIC_* values are used.
import { PUBLIC_KB_DEMO_TARGET_URI, PUBLIC_KB_TARGET_URI } from '$env/static/public';
import type { BoxConfig } from '$lib/types';

let box: BoxConfig = {
	targetUri: PUBLIC_KB_TARGET_URI,
	demoTargetUri: PUBLIC_KB_DEMO_TARGET_URI
};

const nonEmpty = (value: unknown, fallback: string) =>
	typeof value === 'string' && value.trim() ? value : fallback;

/** Never rejects: a missing or invalid /box.json just keeps the build-time values */
export async function loadBox(): Promise<BoxConfig> {
	try {
		const response = await fetch('/box.json');
		if (response.ok) {
			// May be index.html if the webserver falls back to the SPA, then json() throws
			const data = (await response.json()) as Partial<Record<keyof BoxConfig, unknown>>;
			box = {
				targetUri: nonEmpty(data.targetUri, box.targetUri),
				demoTargetUri: nonEmpty(data.demoTargetUri, box.demoTargetUri)
			};
		}
	} catch (error) {
		console.warn('Using build-time box values, /box.json not usable:', error);
	}
	return box;
}

export const getBox = (): BoxConfig => box;
