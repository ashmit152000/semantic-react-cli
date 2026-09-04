import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateHook } from './hook.js';

async function inTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'semantic-react-'));
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    await fn(dir);
  } finally {
    process.chdir(cwd);
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('creates a hook file', async () => {
  await inTempDir(async (dir) => {
    await generateHook('useToggle', { tsx: true });
    const base = path.join(dir, 'hooks');
    const tsx = await fs.readFile(path.join(base, 'useToggle.tsx'), 'utf8');
    assert.match(tsx, /export default function useToggle\(\)/);
  });
});

test('defaults to a .js extension when no option is passed', async () => {
  await inTempDir(async (dir) => {
    await generateHook('useDebounce');
    const base = path.join(dir, 'hooks');
    await fs.access(path.join(base, 'useDebounce.js'));
  });
});

test('switching extension removes the stale file', async () => {
  await inTempDir(async (dir) => {
    await generateHook('useFetch', { jsx: true });
    await generateHook('useFetch', { tsx: true });
    const base = path.join(dir, 'hooks');
    await fs.access(path.join(base, 'useFetch.tsx'));
    await assert.rejects(fs.access(path.join(base, 'useFetch.jsx')));
  });
});
