import path from "path";
import fs from "fs/promises";

async function deleteFlatFile(kind, name, options = {}, destinationPath) {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const filePath = path.join(process.cwd(), destinationPath, `${name}.${extension}`);

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`${name}.${extension} not found in ${destinationPath}`);
            return;
        }
        throw error;
    }

    console.log(`Successfully deleted ${kind} file: \n 🔴 ${name}.${extension}`);
}

export async function deleteComponent(name, options = {}, destinationPath = 'components') {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const folderPath = path.join(process.cwd(), destinationPath, name);
    const filePath = path.join(folderPath, `${name}.${extension}`);
    const cssPath = path.join(folderPath, `${name}.css`);

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`${name}.${extension} not found in ${path.join(destinationPath, name)}`);
            return;
        }
        throw error;
    }

    let cssDeleted = false;
    try {
        await fs.unlink(cssPath);
        cssDeleted = true;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    // Remove the component folder if nothing else is left in it
    try {
        await fs.rmdir(folderPath);
    } catch (error) {
        if (error.code !== 'ENOTEMPTY' && error.code !== 'ENOENT') throw error;
    }

    console.log(`Successfully deleted component file: \n 🔴 ${name}.${extension}`);
    if (cssDeleted) {
        console.log(`Also deleted the colocated CSS file: \n 🔴 ${name}.css`);
    }
}

export async function deleteHook(name, options = {}, destinationPath = 'hooks') {
    await deleteFlatFile('hook', name, options, destinationPath);
}

export async function deleteHelper(name, options = {}, destinationPath = 'helpers') {
    await deleteFlatFile('helper', name, options, destinationPath);
}
