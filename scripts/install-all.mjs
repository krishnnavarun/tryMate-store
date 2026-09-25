// Installs dependencies for the root (concurrently), server/ and client/.
//
//   npm run install:all
//
// Why a script instead of "npm install && npm install --prefix server ..." in package.json:
// when npm runs a script it passes its settings to child processes as npm_config_*
// environment variables. npm 11 refuses some of those (e.g. allow-scripts) when they come
// from the environment of a nested install. Running each install with those variables
// removed avoids that; every install still reads your .npmrc files normally.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^npm_config_/i.test(key)));

for (const dir of ['.', 'server', 'client']) {
  console.log(`\n📦 npm install in ${dir === '.' ? 'the repo root' : `${dir}/`}`);
  const result = spawnSync('npm install', {
    cwd: path.join(root, dir),
    env,
    stdio: 'inherit',
    shell: true, // needed on Windows, where npm is npm.cmd
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\n✅ All dependencies installed');
