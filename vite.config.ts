import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	worker: {
		// maplibre-gl v6 runs its worker as an ES module worker
		format: 'es'
	}
});
