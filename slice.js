import fs from 'fs/promises';
import path from 'path';
import { confirm } from './prompt.js';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

export async function generateSlice(sliceName, options = {}, destinationPath = 'slices', confirmFn = confirm, reducerNames = []) {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const folderPath = path.join(process.cwd(), destinationPath);
    const filePath = path.join(folderPath, `${sliceName}.${extension}`);

    try {
        await fs.mkdir(folderPath, { recursive: true });

        // Find any existing file for this slice that has a different extension
        const staleFiles = [];
        for (const ext of ALLOWED_EXTENSIONS) {
            if (ext === extension) continue;
            const oldFilePath = path.join(folderPath, `${sliceName}.${ext}`);
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

        const reducers = reducerNames.map((name) => name.trim()).filter(Boolean);

        const reducerBlock = reducers.length > 0
            ? reducers.map((reducerName) => `    ${reducerName}(state) {\n      // ...\n    },`).join('\n')
            : '    // ...';

        const actionsExport = reducers.length > 0
            ? `\nexport const { ${reducers.join(', ')} } = ${sliceName}Slice.actions;\n`
            : '';

        const content = `import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

const ${sliceName}Slice = createSlice({
  name: '${sliceName}',
  initialState,
  reducers: {
${reducerBlock}
  },
});
${actionsExport}
export default ${sliceName}Slice.reducer;
`;
        await fs.writeFile(filePath, content);

        console.log(`successfully created \n 🟢 ${sliceName}.${extension} \n`);
    } catch (err) {
        console.log('Error: ', err);
    }
}
