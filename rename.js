import fs from 'fs/promises';
import path from 'path';
import { confirm } from './prompt.js';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

function extensionFromOptions(options = {}) {
    if (options.tsx) return 'tsx';
    if (options.jsx) return 'jsx';
    if (options.ts) return 'ts';
    if (options.js) return 'js';
    return null; // no flag passed -> keep the current extension
}

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

// Find which extension the existing scaffold uses inside `dir`.
async function detectExtension(dir, name) {
    for (const ext of ALLOWED_EXTENSIONS) {
        if (await exists(path.join(dir, `${name}.${ext}`))) return ext;
    }
    return null;
}

// Replace whole-word occurrences of the old name (function declaration,
// default export, displayName, ...) with the new name.
function renameIdentifier(content, oldName, newName) {
    return content.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
}

// Guard against renaming files outside the project the command runs in.
function isInsideProject(absPath) {
    const relPath = path.relative(process.cwd(), absPath);
    return relPath !== '' && !relPath.startsWith('..') && !path.isAbsolute(relPath);
}

function staysInProject(oldName, newName, ...targets) {
    for (const target of targets) {
        if (!isInsideProject(target)) {
            console.log(`"${oldName}" or "${newName}" points outside this project; rename only works within the current project.`);
            return false;
        }
    }
    return true;
}

export async function renameComponent(oldName, newName, options = {}, destinationPath = 'components', confirmFn = confirm) {
    const oldFolder = path.join(process.cwd(), destinationPath, oldName);
    const newFolder = path.join(process.cwd(), destinationPath, newName);

    if (!staysInProject(oldName, newName, oldFolder, newFolder)) return;

    const oldExtension = await detectExtension(oldFolder, oldName);
    if (oldExtension === null) {
        console.log(`No ${oldName} component found in ${path.join(destinationPath, oldName)}`);
        return;
    }
    const newExtension = extensionFromOptions(options) ?? oldExtension;

    const oldFile = path.join(oldFolder, `${oldName}.${oldExtension}`);
    const oldCss = path.join(oldFolder, `${oldName}.css`);
    const newFile = path.join(newFolder, `${newName}.${newExtension}`);
    const newCss = path.join(newFolder, `${newName}.css`);

    if (await exists(newFile)) {
        console.log(`${newName}.${newExtension} already exists in ${path.join(destinationPath, newName)}`);
        return;
    }

    let content = await fs.readFile(oldFile, 'utf8');

    const renameFn = await confirmFn(`Also rename the component function from ${oldName} to ${newName}?`);
    if (renameFn) content = renameIdentifier(content, oldName, newName);

    await fs.mkdir(newFolder, { recursive: true });
    await fs.writeFile(newFile, content);
    await fs.unlink(oldFile);

    let cssMoved = false;
    try {
        await fs.rename(oldCss, newCss);
        cssMoved = true;
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    // Drop the old component folder if nothing else is left in it
    try {
        await fs.rmdir(oldFolder);
    } catch (err) {
        if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOENT') throw err;
    }

    console.log(`Renamed component: \n 🟢 ${oldName}.${oldExtension} → ${newName}.${newExtension}`);
    if (cssMoved) console.log(` 🟣 ${oldName}.css → ${newName}.css`);
    if (renameFn) console.log(` ✏️  function ${oldName} → ${newName}`);
}

async function renameFlatFile(kind, oldName, newName, options, destinationPath, confirmFn) {
    const folder = path.join(process.cwd(), destinationPath);

    if (!staysInProject(oldName, newName, path.resolve(folder, oldName), path.resolve(folder, newName))) return;

    const oldExtension = await detectExtension(folder, oldName);
    if (oldExtension === null) {
        console.log(`No ${oldName} ${kind} found in ${destinationPath}`);
        return;
    }
    const newExtension = extensionFromOptions(options) ?? oldExtension;

    const oldFile = path.join(folder, `${oldName}.${oldExtension}`);
    const newFile = path.join(folder, `${newName}.${newExtension}`);

    if (await exists(newFile)) {
        console.log(`${newName}.${newExtension} already exists in ${destinationPath}`);
        return;
    }

    let content = await fs.readFile(oldFile, 'utf8');

    const renameFn = await confirmFn(`Also rename the ${kind} function from ${oldName} to ${newName}?`);
    if (renameFn) content = renameIdentifier(content, oldName, newName);

    await fs.writeFile(newFile, content);
    await fs.unlink(oldFile);

    console.log(`Renamed ${kind}: \n 🟢 ${oldName}.${oldExtension} → ${newName}.${newExtension}`);
    if (renameFn) console.log(` ✏️  function ${oldName} → ${newName}`);
}

export async function renameHelper(oldName, newName, options = {}, destinationPath = 'helpers', confirmFn = confirm) {
    await renameFlatFile('helper', oldName, newName, options, destinationPath, confirmFn);
}

// Rename any file by its path, keeping it in the same folder. The colocated
// CSS (if any) follows, and you are asked whether to rename the exported
// function too. Use this to fix up a file that `move` relocated.
export async function renameAtPath(filePath, newName, options = {}, confirmFn = confirm) {
    const oldFile = path.resolve(process.cwd(), filePath);

    if (!isInsideProject(oldFile)) {
        console.log(`${filePath} is outside this project; rename only works within the current project.`);
        return;
    }

    let stat;
    try {
        stat = await fs.stat(oldFile);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`${filePath} not found`);
            return;
        }
        throw err;
    }
    if (!stat.isFile()) {
        console.log(`${filePath} is not a file`);
        return;
    }

    const dir = path.dirname(oldFile);
    const oldExtension = path.extname(oldFile).slice(1);
    const oldName = path.basename(oldFile, path.extname(oldFile));

    // Accept a bare name; ignore any directory or extension the user typed
    const cleanName = path.basename(newName, path.extname(newName));
    if (cleanName === '') {
        console.log('Please give a new name for the file.');
        return;
    }

    const newExtension = extensionFromOptions(options) ?? oldExtension;
    const newFile = path.join(dir, `${cleanName}.${newExtension}`);

    if (!isInsideProject(newFile)) {
        console.log(`${cleanName} is outside this project; rename only works within the current project.`);
        return;
    }

    if (newFile === oldFile) {
        console.log('The new name matches the current one; nothing to do.');
        return;
    }
    if (await exists(newFile)) {
        console.log(`${cleanName}.${newExtension} already exists in ${path.dirname(filePath)}`);
        return;
    }

    let content = await fs.readFile(oldFile, 'utf8');

    const renameFn = await confirmFn(`Also rename the exported function from ${oldName} to ${cleanName}?`);
    if (renameFn) content = renameIdentifier(content, oldName, cleanName);

    await fs.writeFile(newFile, content);
    await fs.unlink(oldFile);

    let cssMoved = false;
    try {
        await fs.rename(path.join(dir, `${oldName}.css`), path.join(dir, `${cleanName}.css`));
        cssMoved = true;
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    console.log(`Renamed: \n 🟢 ${path.relative(process.cwd(), oldFile)} → ${path.relative(process.cwd(), newFile)}`);
    if (cssMoved) console.log(` 🟣 ${oldName}.css → ${cleanName}.css`);
    if (renameFn) console.log(` ✏️  function ${oldName} → ${cleanName}`);
}

export async function renameHook(oldName, newName, options = {}, destinationPath = 'hooks', confirmFn = confirm) {
    await renameFlatFile('hook', oldName, newName, options, destinationPath, confirmFn);
}
