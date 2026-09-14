import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateSlice } from './slice.js';

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

test('creates a slice file with createSlice boilerplate', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('counter', { ts: true });
    const base = path.join(dir, 'slices');
    const ts = await fs.readFile(path.join(base, 'counter.ts'), 'utf8');
    assert.match(ts, /import \{ createSlice \} from '@reduxjs\/toolkit';/);
    assert.match(ts, /const counterSlice = createSlice\(\{/);
    assert.match(ts, /name: 'counter',/);
    assert.match(ts, /export default counterSlice\.reducer;/);
  });
});

test('defaults to a .js extension when no option is passed', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('user');
    const base = path.join(dir, 'slices');
    await fs.access(path.join(base, 'user.js'));
  });
});

test('switching extension removes the stale file when confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('cart', { jsx: true });
    await generateSlice('cart', { tsx: true }, undefined, async () => true);
    const base = path.join(dir, 'slices');
    await fs.access(path.join(base, 'cart.tsx'));
    await assert.rejects(fs.access(path.join(base, 'cart.jsx')));
  });
});

test('switching extension keeps the stale file when not confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('auth', { jsx: true });
    await generateSlice('auth', { tsx: true }, undefined, async () => false);
    const base = path.join(dir, 'slices');
    await fs.access(path.join(base, 'auth.tsx'));
    await fs.access(path.join(base, 'auth.jsx'));
  });
});

test('scaffolds a reducer function for each name passed', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('counter', { ts: true }, undefined, undefined, ['increment', 'decrement']);
    const base = path.join(dir, 'slices');
    const ts = await fs.readFile(path.join(base, 'counter.ts'), 'utf8');
    assert.match(ts, /increment\(state\) \{\n\s+\/\/ \.\.\.\n\s+\},/);
    assert.match(ts, /decrement\(state\) \{\n\s+\/\/ \.\.\.\n\s+\},/);
    assert.match(ts, /export const \{ increment, decrement \} = counterSlice\.actions;/);
  });
});

test('writes into a custom destination path when one is given', async () => {
  await inTempDir(async (dir) => {
    await generateSlice('todos', { ts: true }, 'src/store/slices');
    const base = path.join(dir, 'src', 'store', 'slices');
    const ts = await fs.readFile(path.join(base, 'todos.ts'), 'utf8');
    assert.match(ts, /export default todosSlice\.reducer;/);
  });
});
