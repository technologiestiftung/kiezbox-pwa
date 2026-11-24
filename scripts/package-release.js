// Packages one ready-to-deploy ZIP per city for a release: app (build/) + city data as city/.
//   release/kiezbox-<slug>-v<version>.zip
//     index.html, _app/, fonts/, service-worker.js, …   (from build/)
//     city/                                             (from dist/cities/<slug>/, see package-city.js)
// Unzipped into DEPLOY_PATH/ only box.json is missing (per box, never part of a release).
// Usage: npm run build && npm run package:release   (runs in the release workflow via semantic-release)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const buildDir = join(root, 'build');
const releaseDir = join(root, 'release');
const stageRoot = join(releaseDir, 'stage');

/** @param {string} message */
function fail(message) {
	console.error(`\n✖ package-release: ${message}\n`);
	process.exit(1);
}

if (!existsSync(join(buildDir, 'index.html'))) {
	fail('build/ fehlt. Zuerst: npm run build');
}

// semantic-release (@semantic-release/npm) has already bumped package.json at this point
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Every folder in cities/ is a city, except templates like _template
const slugs = readdirSync(join(root, 'cities'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
	.map((entry) => entry.name)
	.sort();
if (slugs.length === 0) fail('Keine Städte in cities/ gefunden.');

rmSync(releaseDir, { recursive: true, force: true });
mkdirSync(stageRoot, { recursive: true });

for (const slug of slugs) {
	// Validation, manifest and the 64 MB check (app + city) stay in package-city.js;
	// a failing city throws here and stops the whole release
	execFileSync(process.execPath, [join(root, 'scripts/package-city.js'), slug], {
		cwd: root,
		stdio: 'inherit'
	});

	const stage = join(stageRoot, slug);
	cpSync(buildDir, stage, { recursive: true });
	cpSync(join(root, 'dist/cities', slug), join(stage, 'city'), { recursive: true });

	const zipFile = join(releaseDir, `kiezbox-${slug}-v${version}.zip`);
	// -X: no extra file attributes (uid/gid, timestamps) in the archive
	execFileSync('zip', ['-qrX', zipFile, '.'], { cwd: stage, stdio: 'inherit' });
	rmSync(stage, { recursive: true, force: true });
	console.log(`✔ ${zipFile.replace(`${root}/`, '')}`);
}

rmSync(stageRoot, { recursive: true, force: true });
console.log(`\n✔ package-release: ${slugs.length} Städte (v${version}): ${slugs.join(', ')}\n`);
