// Serves the city data under /city/ in `vite dev` and `vite preview`, the same path the Kiezbox
// webserver serves it from. Source: CITY_DIR (e.g. a package from dist/cities/<slug>) if set,
// otherwise cities/<PUBLIC_CITY>/. For a raw cities/ folder, city.json is generated per request,
// so edits show up on reload without re-packaging.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { basename, extname, resolve, sep } from 'node:path';
import { loadEnv } from 'vite';
import { CityError, SCHEMA_VERSION, readCity } from './city.js';

const CONTENT_TYPES = {
	'.json': 'application/json; charset=utf-8',
	'.pbf': 'application/x-protobuf'
};

/** @returns {import('vite').Plugin} */
export function cityData() {
	/** @type {string | undefined} */
	let cityDir;
	/** @type {string | undefined} */
	let slug;

	/** @type {import('vite').Connect.NextHandleFunction} */
	function handle(req, res, next) {
		if (!cityDir || !slug || (req.method !== 'GET' && req.method !== 'HEAD')) return next();

		const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);

		if (pathname === '/city.json' && !existsSync(resolve(cityDir, 'city.json'))) {
			try {
				const city = readCity(cityDir, slug);
				const body = { schemaVersion: SCHEMA_VERSION, dataVersion: 'dev', ...city };
				res.setHeader('Content-Type', CONTENT_TYPES['.json']);
				res.setHeader('Cache-Control', 'no-cache');
				res.end(JSON.stringify(body));
			} catch (error) {
				if (!(error instanceof CityError)) throw error;
				res.statusCode = 500;
				res.end(error.message);
			}
			return;
		}

		const file = resolve(cityDir, `.${pathname}`);
		if (!file.startsWith(cityDir + sep) || !existsSync(file) || !statSync(file).isFile()) {
			// Answer here instead of next(): otherwise the SPA fallback would return index.html
			res.statusCode = 404;
			res.end('Not found');
			return;
		}

		const type = CONTENT_TYPES[/** @type {keyof typeof CONTENT_TYPES} */ (extname(file))];
		res.setHeader('Content-Type', type ?? 'application/octet-stream');
		res.setHeader('Cache-Control', 'no-cache');
		if (req.method === 'HEAD') {
			res.end();
			return;
		}
		createReadStream(file).pipe(res);
	}

	return {
		name: 'kiezbox-city-data',
		configResolved(config) {
			const env = loadEnv(config.mode, config.root, '');
			if (env.CITY_DIR) {
				cityDir = resolve(config.root, env.CITY_DIR);
				slug = basename(cityDir);
			} else if (env.PUBLIC_CITY) {
				cityDir = resolve(config.root, 'cities', env.PUBLIC_CITY);
				slug = env.PUBLIC_CITY;
			} else {
				config.logger.warn(
					'⚠ /city/ wird nicht ausgeliefert: weder CITY_DIR noch PUBLIC_CITY gesetzt.'
				);
			}
		},
		configureServer(server) {
			server.middlewares.use('/city', handle);
		},
		configurePreviewServer(server) {
			server.middlewares.use('/city', handle);
		}
	};
}
