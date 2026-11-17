// Builds the Slidev deck in slidedev/ into app/dist/slides so Express serves it at /slides/.
// Run after "vite build" (which empties app/dist). A failure only warns: the rest of the lab still works.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const slides = fileURLToPath(new URL('../slidedev/', import.meta.url));
const out = fileURLToPath(new URL('../app/dist/slides', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  return spawnSync(npm, args, { cwd: slides, stdio: 'inherit' }).status === 0;
}

const ok = (existsSync(`${slides}node_modules`) || run(['install', '--no-audit', '--no-fund']))
  && run(['run', 'build', '--', '--base', '/slides/', '--out', out]);

if (!ok) console.warn(`\nWarning: the slides could not be built (cwd ${root}). The Start page will have no slides.\n`);
