import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateComponent } from './component.js';

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

test('creates a component file and a css file', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Button', { jsx: true });
    const base = path.join(dir, 'components', 'Button');
    const jsx = await fs.readFile(path.join(base, 'Button.jsx'), 'utf8');
    assert.match(jsx, /export default function Button\(\)/);
    await fs.access(path.join(base, 'Button.css'));
  });
});

test('switching extension removes the stale file when confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Card', { jsx: true });
    await generateComponent('Card', { tsx: true }, undefined, async () => true);
    const base = path.join(dir, 'components', 'Card');
    await fs.access(path.join(base, 'Card.tsx'));
    await assert.rejects(fs.access(path.join(base, 'Card.jsx')));
  });
});

test('switching extension keeps the stale file when not confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Panel', { jsx: true });
    await generateComponent('Panel', { tsx: true }, undefined, async () => false);
    const base = path.join(dir, 'components', 'Panel');
    await fs.access(path.join(base, 'Panel.tsx'));
    await fs.access(path.join(base, 'Panel.jsx'));
  });
});

test('writes into a custom destination path when one is given', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Modal', { jsx: true }, 'src/ui/components');
    const base = path.join(dir, 'src', 'ui', 'components', 'Modal');
    const jsx = await fs.readFile(path.join(base, 'Modal.jsx'), 'utf8');
    assert.match(jsx, /export default function Modal\(\)/);
    await fs.access(path.join(base, 'Modal.css'));
  });
});
