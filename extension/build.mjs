import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

const apiBaseUrl =
  process.env.EXTENSION_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

const apiOrigin = (() => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    throw new Error(`Invalid EXTENSION_API_URL: ${apiBaseUrl}`);
  }
})();

console.log(`Building SwipePrep extension → ${DIST}`);
console.log(`API base URL: ${apiBaseUrl}`);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const shared = {
  bundle: true,
  minify: process.env.MINIFY !== '0',
  sourcemap: false,
  target: ['chrome120'],
  define: {
    __API_BASE_URL__: JSON.stringify(apiBaseUrl),
  },
  logLevel: 'info',
};

await Promise.all([
  build({
    ...shared,
    entryPoints: [join(ROOT, 'src/popup/index.tsx')],
    outfile: join(DIST, 'popup/index.js'),
    format: 'iife',
    jsx: 'automatic',
  }),
  build({
    ...shared,
    entryPoints: [join(ROOT, 'src/content/content.ts')],
    outfile: join(DIST, 'content/content.js'),
    format: 'iife',
  }),
  build({
    ...shared,
    entryPoints: [join(ROOT, 'src/background/service-worker.ts')],
    outfile: join(DIST, 'background/service-worker.js'),
    format: 'iife',
  }),
]);

// Static assets
cpSync(join(ROOT, 'src/popup/popup.html'), join(DIST, 'popup/popup.html'));
cpSync(join(ROOT, 'src/popup/styles.css'), join(DIST, 'popup/styles.css'));

// Test application page (served over http://localhost for content scripts)
cpSync(join(ROOT, 'test'), join(DIST, 'test'), { recursive: true });

// Manifest with the API origin templated in
const manifest = readFileSync(join(ROOT, 'manifest.json'), 'utf8')
  .replaceAll('{{API_ORIGIN}}', apiOrigin);
writeFileSync(join(DIST, 'manifest.json'), manifest);

// Icons
const icons = spawnSync(process.execPath, [join(ROOT, 'scripts/generate-icons.mjs')], {
  stdio: 'inherit',
});
if (icons.status !== 0) {
  throw new Error('Icon generation failed');
}

console.log('Build complete. Load dist/ as an unpacked extension in chrome://extensions.');
