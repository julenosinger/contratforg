// The native-solc oracle must never mistake the npm `solcjs` (the Emscripten build) for a native binary. This tests the
// version classifier with real strings and runs the oracle under the npm PATH (node_modules/.bin first) to prove it
// still skips instead of crashing.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNativeSolcVersion } from './native-solc-version.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? ' (' + d + ')' : '')); } };

/* the classifier */
ok(isNativeSolcVersion('0.8.24+commit.e11b9ed9.Linux.g++') === true, 'Linux.g++ is native');
ok(isNativeSolcVersion('0.8.24+commit.e11b9ed9.Darwin.appleclang') === true, 'Darwin.appleclang is native');
ok(isNativeSolcVersion('0.8.24+commit.e11b9ed9.Windows.msvc') === true, 'Windows.msvc is native');
ok(isNativeSolcVersion('0.8.24+commit.e11b9ed9.Emscripten.clang') === false, 'Emscripten.clang is NOT native');
ok(isNativeSolcVersion('0.8.24+commit.e11b9ed9') === false, 'no platform marker is not native');
ok(isNativeSolcVersion('solc: version 0.8.24+commit.e11b9ed9.Linux.g++') === true, 'the marker is found inside a longer line');
ok(isNativeSolcVersion('') === false, 'an empty version is not native');

/* regression: under the npm PATH (node_modules/.bin first) the oracle still skips */
{
  const bin = path.join(here, 'node_modules', '.bin');
  const sep = process.platform === 'win32' ? ';' : ':';
  const env = { ...process.env, PATH: bin + sep + (process.env.PATH || '') };
  const r = spawnSync('node', [path.join(here, 'native-solc-bytecode.mjs')], { encoding: 'utf8', env });
  ok(r.status === 0, 'the oracle exits 0 under the npm PATH', 'status ' + r.status + ' ' + (r.stderr || '').slice(0, 160));
  ok(/NÃO rodei o oráculo nativo/.test(r.stdout || ''), 'it prints the skip notice (solcjs is not mistaken for a native binary)', (r.stdout || '').slice(0, 120));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
