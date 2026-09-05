import fs from 'fs/promises';
import defaultOptions from './default.js';

export default async function readJsonFile(filePath) {
    const paths = { ...defaultOptions };

    let fileContents;
    try {
        fileContents = await fs.readFile(filePath, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            // If semantic-react.settings.json is not present return the defaults.
            return paths;
        }
        throw err;
    }

    const pathsFromSettings = JSON.parse(fileContents);
    for (const key of Object.keys(defaultOptions)) {
        if (pathsFromSettings[key] !== undefined) {
            paths[key] = pathsFromSettings[key];
        }
    }

    return paths;
}
