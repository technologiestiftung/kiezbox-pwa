/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';
import { CITY_PATH } from '$lib/config/city';
import type { CityManifest } from '$lib/types';

// The app and the city data (/city/: tiles, POIs, texts) are updated independently, so they get
// separate caches: an app update replaces APP_CACHE but keeps CITY_CACHE, and new city data
// (a different dataVersion in /city/city.json) replaces CITY_CACHE but leaves the app alone.
const APP_CACHE = `app-${version}`;
const CITY_CACHE = 'city-data';
const ASSETS = [...build, ...files];
const MANIFEST_PATH = `${CITY_PATH}/city.json`;

// SW is automatically registered in SvelteKit if a service-worker.js/ts is present

// install service worker
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(APP_CACHE);
		await cache.addAll(ASSETS);
	}
	event.waitUntil(addFilesToCache());
});

// activate service worker
self.addEventListener('activate', (event) => {
	console.log('Service Worker activated');

	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== APP_CACHE && key !== CITY_CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

/**
 * Network first, so a changed dataVersion is noticed as soon as the box is reachable. On a new
 * dataVersion the old city data is dropped and all files of the new one are cached in the
 * background, so the whole map works offline later, not just the parts already viewed.
 */
async function respondCityManifest(event: FetchEvent): Promise<Response> {
	const cache = await caches.open(CITY_CACHE);
	let response: Response;
	try {
		response = await fetch(event.request);
	} catch {
		return (await cache.match(MANIFEST_PATH)) ?? new Response('Not found', { status: 404 });
	}
	if (!response.ok) return response;

	const manifest = (await response.clone().json()) as CityManifest;
	const cached = await cache.match(MANIFEST_PATH);
	const cachedVersion = cached ? ((await cached.json()) as CityManifest).dataVersion : null;

	if (manifest.dataVersion !== cachedVersion) {
		await caches.delete(CITY_CACHE);
		const freshCache = await caches.open(CITY_CACHE);
		await freshCache.put(MANIFEST_PATH, response.clone());
		event.waitUntil(precacheCityFiles(freshCache, manifest));
	}
	return response;
}

async function precacheCityFiles(cache: Cache, manifest: CityManifest) {
	const urls = manifest.files.map((file) => `${CITY_PATH}/${file}`);
	// One by one instead of cache.addAll(): a single failed tile must not discard all others
	for (const url of urls) {
		if (await cache.match(url)) continue;
		try {
			const response = await fetch(url);
			if (response.ok) await cache.put(url, response);
		} catch {
			// Box not reachable anymore; the remaining files are cached when they are requested
			return;
		}
	}
}

/** Cache first: city files only change together with the dataVersion, see above */
async function respondCityFile(request: Request, pathname: string): Promise<Response> {
	const cache = await caches.open(CITY_CACHE);
	const cached = await cache.match(pathname);
	if (cached) return cached;

	try {
		const response = await fetch(request);
		if (response.ok) cache.put(pathname, response.clone());
		return response;
	} catch {
		return new Response('Not found', { status: 404 });
	}
}

// NOTE:
// Service Worker funktionieren nur über HTTPS, da sie sehr mächtige Fähigkeiten haben
// (wie das Abfangen von Anfragen).
// HTTPS sorgt dafür, dass der Service Worker sicher eingesetzt wird.
// listen to fetch events
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);

	if (url.origin === self.location.origin && url.pathname.startsWith(`${CITY_PATH}/`)) {
		event.respondWith(
			url.pathname === MANIFEST_PATH
				? respondCityManifest(event)
				: respondCityFile(event.request, url.pathname)
		);
		return;
	}

	async function respond() {
		const cache = await caches.open(APP_CACHE);

		// serve builded files from the cache
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		try {
			const response = await fetch(event.request);
			const isNotExtension = url.protocol === 'http:' || url.protocol === 'https:';
			const isSuccess = response.status >= 200 && response.status < 300;
			if (isNotExtension && isSuccess) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			// fallback to cache
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		return new Response('Not found', { status: 404 });
	}

	event.respondWith(respond());
});

// skip waiting until the next time the service worker is activated
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
