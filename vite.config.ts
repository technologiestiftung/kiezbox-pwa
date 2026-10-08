import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { cityData } from './scripts/lib/vite-plugin-city.js';

export default defineConfig({
	plugins: [cityData(), sveltekit(), tailwindcss()],
	worker: {
		// maplibre-gl v6 runs its worker as an ES module worker
		format: 'es'
	}
});
