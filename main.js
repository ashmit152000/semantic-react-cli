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

program.parse(process.argv);
