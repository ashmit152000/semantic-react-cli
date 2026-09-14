import fs from 'fs/promises';
import path from 'path';
import { confirm } from './prompt.js';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

export async function generatePage(pageName, options = {}, destinationPath = options.app ? 'app' : 'pages', confirmFn = confirm) {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const isAppRouter = !!options.app;

    // App Router: one route-segment folder per page, always named "page.<ext>".
    // Pages Router: a flat file named after the route, e.g. pages/about.tsx.
    const folderPath = isAppRouter
        ? path.join(process.cwd(), destinationPath, pageName)
        : path.join(process.cwd(), destinationPath);
    const baseFileName = isAppRouter ? 'page' : pageName;
    const filePath = path.join(folderPath, `${baseFileName}.${extension}`);

    try {
        await fs.mkdir(folderPath, { recursive: true });

        // Find any existing file for this page that has a different extension
        const staleFiles = [];
        for (const ext of ALLOWED_EXTENSIONS) {
            if (ext === extension) continue;
            const oldFilePath = path.join(folderPath, `${baseFileName}.${ext}`);
            try {
                await fs.access(oldFilePath);
                staleFiles.push(oldFilePath);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        }

        if (staleFiles.length > 0) {
            const fileNames = staleFiles.map((f) => path.basename(f)).join(', ');
            const shouldDelete = await confirmFn(`Found existing file(s) with a different extension: ${fileNames}. Delete them?`);
            if (shouldDelete) {
                for (const oldFilePath of staleFiles) {
                    await fs.unlink(oldFilePath);
                    console.log(`Removed ${oldFilePath}`);
                }
            } else {
                console.log('Keeping existing file(s); skipping deletion.');
            }
        }

        const content = isAppRouter
            ? `export default function Page() {\n  // ...\n}\n`
            : `export default function ${pageName}() {\n  // ...\n}\n`;
        await fs.writeFile(filePath, content);

        const displayName = isAppRouter ? `${pageName}/${baseFileName}` : pageName;
        console.log(`successfully created \n 🟢 ${displayName}.${extension} \n`);
    } catch (err) {
        console.log('Error: ', err);
    }
}
