import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateContext } from './context.js';

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

test('creates a context file with a provider and hook', async () => {
  await inTempDir(async (dir) => {
    await generateContext('Theme', { tsx: true });
    const base = path.join(dir, 'contexts');
    const tsx = await fs.readFile(path.join(base, 'Theme.tsx'), 'utf8');
    assert.match(tsx, /const ThemeContext = createContext\(undefined\)/);
    assert.match(tsx, /export function ThemeProvider\(\{ children \}\)/);
    assert.match(tsx, /export function useTheme\(\)/);
  });
});

test('defaults to a .js extension when no option is passed', async () => {
  await inTempDir(async (dir) => {
    await generateContext('Auth');
    const base = path.join(dir, 'contexts');
    await fs.access(path.join(base, 'Auth.js'));
  });
});

test('switching extension removes the stale file when confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateContext('User', { jsx: true });
    await generateContext('User', { tsx: true }, undefined, async () => true);
    const base = path.join(dir, 'contexts');
    await fs.access(path.join(base, 'User.tsx'));
    await assert.rejects(fs.access(path.join(base, 'User.jsx')));
  });
});

test('switching extension keeps the stale file when not confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateContext('Cart', { jsx: true });
    await generateContext('Cart', { tsx: true }, undefined, async () => false);
    const base = path.join(dir, 'contexts');
    await fs.access(path.join(base, 'Cart.tsx'));
    await fs.access(path.join(base, 'Cart.jsx'));
  });
});

test('writes into a custom destination path when one is given', async () => {
  await inTempDir(async (dir) => {
    await generateContext('Theme', { tsx: true }, 'src/contexts');
    const base = path.join(dir, 'src', 'contexts');
    const tsx = await fs.readFile(path.join(base, 'Theme.tsx'), 'utf8');
    assert.match(tsx, /export function useTheme\(\)/);
  });
});
