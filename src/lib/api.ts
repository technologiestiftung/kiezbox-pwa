import { PUBLIC_KB_SERVER_ADDRESS } from '$env/static/public';

const isCrossOrgin =
	typeof window !== 'undefined' &&
	window.location.origin !== new URL(PUBLIC_KB_SERVER_ADDRESS).origin;

export async function apiFetch(resource: string, options: RequestInit = {}) {
	const url = `${PUBLIC_KB_SERVER_ADDRESS}${resource}`; // e.g., resource = '/status'

	const fetchOptions: RequestInit = {
		...options,
		headers: {
			'Content-Type': 'application/json', // Example header
			...options.headers
		}
	};
	if (isCrossOrgin) {
		fetchOptions.credentials = 'include';
	}

	try {
		const response = await fetch(url, fetchOptions);

		if (!response.ok) {
			console.error(`API Error: ${response.status} ${response.statusText}`);
			throw new Error(`API request failed: ${response.status}`);
		}

		if (response.status === 204) {
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error('Fetch failed:', error);
		throw error; // Re-throw for the caller to handle
	}
}
