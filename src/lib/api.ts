import { PUBLIC_GO_API_BASE_URL } from '$env/static/public';

const isCrossOrgin =
	typeof window !== 'undefined' &&
	window.location.origin !== new URL(PUBLIC_GO_API_BASE_URL).origin;

export async function apiFetch(resource: string, options: RequestInit = {}) {
	const url = `${PUBLIC_GO_API_BASE_URL}${resource}`; // e.g., resource = '/status'

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

		// Assuming JSON response, adjust if needed
		return await response.json();
	} catch (error) {
		console.error('Fetch failed:', error);
		throw error; // Re-throw for the caller to handle
	}
}
