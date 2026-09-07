import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateComponent } from './component.js';
import { generateHook } from './hook.js';
import { generateHelper } from './helper.js';
import { deleteComponent, deleteHook, deleteHelper } from './delete.js';

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

test('deleteComponent removes the component file, its css, and the empty folder', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Button', { jsx: true });
    const base = path.join(dir, 'components', 'Button');

    await deleteComponent('Button', { jsx: true });

    await assert.rejects(fs.access(base));
  });
});

test('deleteComponent still works when there is no css file', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Bare', { jsx: true });
    const base = path.join(dir, 'components', 'Bare');
    await fs.rm(path.join(base, 'Bare.css'));

    await deleteComponent('Bare', { jsx: true });

    await assert.rejects(fs.access(path.join(base, 'Bare.jsx')));
  });
});

test('deleteComponent keeps the folder when other files remain', async () => {
  await inTempDir(async (dir) => {
    await generateComponent('Panel', { jsx: true });
    const base = path.join(dir, 'components', 'Panel');
    await fs.writeFile(path.join(base, 'Panel.test.jsx'), '');

    await deleteComponent('Panel', { jsx: true });

    await assert.rejects(fs.access(path.join(base, 'Panel.jsx')));
    await fs.access(path.join(base, 'Panel.test.jsx'));
  });
});

test('deleteHook removes the hook file', async () => {
  await inTempDir(async (dir) => {
    await generateHook('useToggle', { tsx: true });
    const filePath = path.join(dir, 'hooks', 'useToggle.tsx');

    await deleteHook('useToggle', { tsx: true });

    await assert.rejects(fs.access(filePath));
  });
});

test('deleteHelper removes the helper file', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('formatDate');
    const filePath = path.join(dir, 'helpers', 'formatDate.js');

    await deleteHelper('formatDate');

    await assert.rejects(fs.access(filePath));
  });
});

test('deleteHelper targets the extension named by the option', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('slugify', { ts: true });
    // Keep the stale file rather than triggering the interactive prompt.
    await generateHelper('slugify', { jsx: true }, undefined, async () => false);

    await deleteHelper('slugify', { ts: true });

    await assert.rejects(fs.access(path.join(dir, 'helpers', 'slugify.ts')));
    await fs.access(path.join(dir, 'helpers', 'slugify.jsx'));
  });
});

test('deleting a missing flat file is a no-op', async () => {
  await inTempDir(async () => {
    await deleteHook('doesNotExist', { ts: true });
  });
});

test('deleting a missing component is a no-op', async () => {
  await inTempDir(async () => {
    await deleteComponent('Ghost', { jsx: true });
  });
});
