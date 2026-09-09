import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { listPaths, listDirectory } from './list.js';

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

function captureLog(fn) {
  const original = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      console.log = original;
    })
    .then(() => lines.join('\n'));
}

const paths = { components: 'components', helpers: 'helpers', hooks: 'hooks' };

test('lists files in each configured path', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.jsx'), '');
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.css'), '');
    await fs.mkdir(path.join(dir, 'helpers'), { recursive: true });
    await fs.writeFile(path.join(dir, 'helpers', 'formatDate.js'), '');
    await fs.mkdir(path.join(dir, 'hooks'), { recursive: true });
    await fs.writeFile(path.join(dir, 'hooks', 'useToggle.ts'), '');

    const output = await captureLog(() => listPaths(paths));

    assert.match(output, /Button\.jsx/);
    assert.match(output, /Button\.css/);
    assert.match(output, /formatDate\.js/);
    assert.match(output, /useToggle\.ts/);
  });
});

test('draws tree connectors and nests folders', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Nav', 'Menu'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Nav', 'Nav.jsx'), '');
    await fs.writeFile(path.join(dir, 'components', 'Nav', 'Menu', 'Menu.jsx'), '');
    await fs.mkdir(path.join(dir, 'components', 'Empty'), { recursive: true });

    const output = await captureLog(() => listPaths(paths));

    assert.match(output, /├── 📁 Empty/);
    assert.match(output, /└── \(empty\)/);
    assert.match(output, /└── 📁 Nav/);
    assert.match(output, /│ {3}└── ⚛️ Menu\.jsx/);
    assert.match(output, /└── ⚛️ Nav\.jsx/);
  });
});

test('reports a missing path instead of throwing', async () => {
  await inTempDir(async () => {
    const output = await captureLog(() => listPaths(paths));
    assert.match(output, /path does not exist yet/);
  });
});

test('reports an empty path', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'helpers'), { recursive: true });
    const output = await captureLog(() => listPaths(paths));
    assert.match(output, /\(empty\)/);
  });
});

test('listDirectory lists the tree under a given path', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'src', 'features', 'Auth'), { recursive: true });
    await fs.writeFile(path.join(dir, 'src', 'features', 'Auth', 'Login.tsx'), '');
    await fs.writeFile(path.join(dir, 'src', 'features', 'index.ts'), '');

    const output = await captureLog(() => listDirectory('src'));

    assert.match(output, /^\nsrc/);
    assert.match(output, /└── 📁 features/);
    assert.match(output, /├── 📁 Auth/);
    assert.match(output, /└── ⚛️ Login\.tsx/);
    assert.match(output, /└── 🟦 index\.ts/);
  });
});

test('listDirectory reports a missing path', async () => {
  await inTempDir(async () => {
    const output = await captureLog(() => listDirectory('nope'));
    assert.match(output, /\(path does not exist\)/);
  });
});

test('listDirectory reports when the path is not a directory', async () => {
  await inTempDir(async (dir) => {
    await fs.writeFile(path.join(dir, 'file.ts'), '');
    const output = await captureLog(() => listDirectory('file.ts'));
    assert.match(output, /\(not a directory\)/);
  });
});
