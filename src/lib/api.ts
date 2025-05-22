import { PUBLIC_API_URL } from '$env/static/public';

const isCrossOrgin =
	typeof window !== 'undefined' && window.location.origin !== new URL(PUBLIC_API_URL).origin;

export const apiFetch = async (resource: string, options: RequestInit = {}): Promise<unknown> => {
	const url = `${PUBLIC_API_URL}${resource}`; // e.g., resource = '/status'

	const fetchOptions: RequestInit = {
		...options,
		headers: {
			'Content-Type': 'application/json', // Default header for JSON data
			...options.headers
		}
	};

	// Add 'credentials' if cross-origin request
	if (isCrossOrgin) {
		fetchOptions.credentials = 'include';
	}

	// If it's a POST request, ensure the method is set and the body is included
	if (options.method === 'POST' && options.body) {
		// Ensure body is stringified if it's an object
		if (typeof options.body !== 'string') {
			fetchOptions.body = JSON.stringify(options.body);
		}
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
};
