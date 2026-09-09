import fs from 'fs/promises';
import path from 'path';
import { confirm, ask } from './prompt.js';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

function hasKnownExtension(p) {
    return ALLOWED_EXTENSIONS.includes(path.extname(p).slice(1).toLowerCase());
}

function looksLikeDir(p) {
    return p.endsWith('/') || p.endsWith(path.sep);
}

function rel(absPath) {
    return path.relative(process.cwd(), absPath);
}

// Guard against moving files in or out of the project the command runs in.
function isInsideProject(absPath) {
    const root = process.cwd();
    const relPath = path.relative(root, absPath);
    return relPath !== '' && !relPath.startsWith('..') && !path.isAbsolute(relPath);
}

async function isExistingDir(absPath) {
    try {
        return (await fs.stat(absPath)).isDirectory();
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

async function fileExists(absPath) {
    try {
        await fs.access(absPath);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

// Move a single file, asking before it overwrites something. Returns true if
// the file was moved, false if the user declined an overwrite.
async function moveOne(srcPath, destPath, confirmFn) {
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    if (await fileExists(destPath)) {
        const overwrite = await confirmFn(`${rel(destPath)} already exists. Overwrite it?`);
        if (!overwrite) return false;
    }

    try {
        await fs.rename(srcPath, destPath);
    } catch (err) {
        if (err.code === 'EXDEV') {
            // Different filesystems: fall back to copy + delete
            await fs.copyFile(srcPath, destPath);
            await fs.unlink(srcPath);
        } else {
            throw err;
        }
    }
    return true;
}

export async function moveFile(source, destination, confirmFn = confirm, askFn = ask) {
    let src = source;

    // Prompt for the extension if the source path is missing one
    if (!hasKnownExtension(src)) {
        const answer = (await askFn(`"${src}" has no file extension. Which one? (${ALLOWED_EXTENSIONS.join('/')})`))
            .trim().toLowerCase().replace(/^\./, '');
        if (!ALLOWED_EXTENSIONS.includes(answer)) {
            console.log(`Unknown extension "${answer}"; aborting.`);
            return;
        }
        src = `${src}.${answer}`;
    }

    const srcPath = path.resolve(process.cwd(), src);
    const srcExt = path.extname(src);

    if (!isInsideProject(srcPath)) {
        console.log(`${src} is outside this project; move only works within the current project.`);
        return;
    }

    let srcStat;
    try {
        srcStat = await fs.stat(srcPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`${src} not found`);
            return;
        }
        throw err;
    }
    if (!srcStat.isFile()) {
        console.log(`${src} is not a file`);
        return;
    }

    // Work out the destination file path
    let destPath = path.resolve(process.cwd(), destination);
    if (looksLikeDir(destination) || (await isExistingDir(destPath))) {
        destPath = path.join(destPath, path.basename(srcPath));
    } else if (!hasKnownExtension(destination)) {
        // A filename that is missing its extension -> reuse the source's
        destPath = `${destPath}${srcExt}`;
    }

    if (!isInsideProject(destPath)) {
        console.log(`${destination} is outside this project; move only works within the current project.`);
        return;
    }

    if (srcPath === destPath) {
        console.log('Source and destination are the same; nothing to do.');
        return;
    }

    // A component keeps a colocated CSS file next to its source. Move it along
    // with the file so the `import './X.css'` inside it keeps working.
    const srcCssPath = path.join(path.dirname(srcPath), `${path.basename(srcPath, srcExt)}.css`);
    const destCssPath = path.join(path.dirname(destPath), `${path.basename(destPath, path.extname(destPath))}.css`);
    const hasCss = await fileExists(srcCssPath);

    const moved = await moveOne(srcPath, destPath, confirmFn);
    if (!moved) {
        console.log('Move cancelled.');
        return;
    }

    let cssMoved = false;
    if (hasCss) {
        cssMoved = await moveOne(srcCssPath, destCssPath, confirmFn);
    }

    // Drop the source folder if the move emptied it
    try {
        await fs.rmdir(path.dirname(srcPath));
    } catch (err) {
        if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOENT') throw err;
    }

    console.log(`Moved: \n 🟢 ${rel(srcPath)} → ${rel(destPath)}`);
    if (cssMoved) {
        console.log(` 🟣 ${rel(srcCssPath)} → ${rel(destCssPath)}`);
    } else if (hasCss) {
        console.log(` ⚠️  kept ${rel(srcCssPath)} (target already exists)`);
    }
}
