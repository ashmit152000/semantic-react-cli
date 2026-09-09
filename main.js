#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { generateComponent } from './component.js';
import { generateHelper } from './helper.js';
import { generateHook } from './hook.js';
import { generateSettings } from './init.js';
import readJsonFile from './json-reader.js';
import { deleteComponent, deleteHelper, deleteHook } from './delete.js';
import { listPaths, listDirectory } from './list.js';
import { renameComponent, renameHelper, renameHook, renameAtPath } from './rename.js';
import { moveFile } from './move.js';
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
);

const paths = await readJsonFile('./semantic-react.settings.json');

const program = new Command();

program
  .name('semantic-react')
  .description(pkg.description)
  .version(pkg.version);

// For creating a settings file pre-filled with the default paths
program
  .command('init')
  .description('Create semantic-react.settings.json with the default paths')
  .option('--force', 'Overwrite an existing settings file')
  .action((options) => generateSettings(options));

const generate = program
  .command('generate')
  .alias('g')
  .description('Generate a scaffold');

// For Creating a component folder with a colocated CSS file
generate
  .command('component <name>')
  .alias('c')
  .description('Generate a component folder with a colocated CSS file')
  .option('--jsx', 'Generate a .jsx file instead of .js')
  .option('--tsx', 'Generate a .tsx file instead of .js')
  .option('--ts', 'Generate a .ts file instead of .js')
  .action((name, options) => generateComponent(name, options, paths.components));

// For Creating a helper file
  generate
    .command('helper <name>')
    .alias('h')
    .description('Generate a helper file')
    .option('--jsx', 'Generate a .jsx file instead of .js')
    .option('--tsx', 'Generate a .tsx file instead of .js')
    .option('--ts', 'Generate a .ts file instead of .js')
    .action((name, options) => generateHelper(name, options, paths.helpers));

// For Creating a hook file
generate
  .command('hook <name>')
  .alias('k')
  .description('Generate a hook file')
  .option('--jsx', 'Generate a .jsx file instead of .js')
  .option('--tsx', 'Generate a .tsx file instead of .js')
  .option('--ts', 'Generate a .ts file instead of .js')
  .action((name, options) => generateHook(name, options, paths.hooks));

  // For delete
  const deleteCommand = program
  .command('delete')
  .alias('d')
  .description('Delete a component, helper, or hook file')

  // delete component
  deleteCommand
  .command('component <name>')
  .alias('c')
  .option('--jsx', 'Target the .jsx file instead of .js')
  .option('--tsx', 'Target the .tsx file instead of .js')
  .option('--ts', 'Target the .ts file instead of .js')
  .description('Delete a component file')
  .action(async (name, options) => {
    await deleteComponent(name, options, paths.components);
  });

  // delete helper
  deleteCommand
  .command('helper <name>')
  .alias('h')
  .option('--jsx', 'Target the .jsx file instead of .js')
  .option('--tsx', 'Target the .tsx file instead of .js')
  .option('--ts', 'Target the .ts file instead of .js')
  .description('Delete a helper file')
  .action(async (name, options) => {
    await deleteHelper(name, options, paths.helpers);
  });

  // delete hook
  deleteCommand
  .command('hook <name>')
  .alias('k')
  .option('--jsx', 'Target the .jsx file instead of .js')
  .option('--tsx', 'Target the .tsx file instead of .js')
  .option('--ts', 'Target the .ts file instead of .js')
  .description('Delete a hook file')
  .action(async (name, options) => {
    await deleteHook(name, options, paths.hooks);
  });


  const list = program
  .command('list [path]')
  .alias('l')
  .description('List the files in the components/helpers/hooks paths, or in a given directory')
  .action((targetPath) => (targetPath ? listDirectory(targetPath) : listPaths(paths)));

  // For rename
  const renameCommand = program
  .command('rename')
  .alias('r')
  .description('Rename a component, helper, hook, or any file by path');

  // rename component
  renameCommand
  .command('component <name> <newName>')
  .alias('c')
  .option('--js', 'Rename to a .js file')
  .option('--jsx', 'Rename to a .jsx file')
  .option('--tsx', 'Rename to a .tsx file')
  .option('--ts', 'Rename to a .ts file')
  .description('Rename a component (keeps the current extension unless one is given)')
  .action(async (name, newName, options) => {
    await renameComponent(name, newName, options, paths.components);
  });

  // rename helper
  renameCommand
  .command('helper <name> <newName>')
  .alias('h')
  .option('--js', 'Rename to a .js file')
  .option('--jsx', 'Rename to a .jsx file')
  .option('--tsx', 'Rename to a .tsx file')
  .option('--ts', 'Rename to a .ts file')
  .description('Rename a helper (keeps the current extension unless one is given)')
  .action(async (name, newName, options) => {
    await renameHelper(name, newName, options, paths.helpers);
  });

  // rename hook
  renameCommand
  .command('hook <name> <newName>')
  .alias('k')
  .option('--js', 'Rename to a .js file')
  .option('--jsx', 'Rename to a .jsx file')
  .option('--tsx', 'Rename to a .tsx file')
  .option('--ts', 'Rename to a .ts file')
  .description('Rename a hook (keeps the current extension unless one is given)')
  .action(async (name, newName, options) => {
    await renameHook(name, newName, options, paths.hooks);
  });

  // rename by path (e.g. to fix up a file that `move` relocated)
  renameCommand
  .command('path <file> <newName>')
  .alias('p')
  .option('--js', 'Rename to a .js file')
  .option('--jsx', 'Rename to a .jsx file')
  .option('--tsx', 'Rename to a .tsx file')
  .option('--ts', 'Rename to a .ts file')
  .description('Rename any file by path, keeping its folder (renames the colocated CSS and, if confirmed, the exported function)')
  .action(async (file, newName, options) => {
    await renameAtPath(file, newName, options);
  });

  // For move
  program
  .command('move <source> <destination>')
  .alias('m')
  .description('Move a file to another path, creating the destination folder if needed')
  .action(async (source, destination) => {
    await moveFile(source, destination);
  });

program.parse(process.argv);
