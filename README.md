# semantic-react-cli

A small CLI that scaffolds React components, helpers, and hooks.

## Install

Global:

```bash
npm install -g semantic-react-cli
```

Or run without installing:

```bash
npx semantic-react-cli generate component Button --jsx
```

## Usage

```bash
semantic-react generate component <Name> [--js | --jsx | --ts | --tsx]
```

You can also generate a helper file:

```bash
semantic-react generate helper <name> [--js | --jsx | --ts | --tsx]
```

Or a hook file:

```bash
semantic-react generate hook <name> [--js | --jsx | --ts | --tsx]
```

Delete a scaffold you no longer need:

```bash
semantic-react delete component <name> [--jsx | --ts | --tsx]
semantic-react delete helper <name> [--jsx | --ts | --tsx]
semantic-react delete hook <name> [--jsx | --ts | --tsx]
```

Rename a scaffold. It keeps the file's current extension unless you pass one,
and asks whether to rename the exported function too:

```bash
semantic-react rename component <name> <newName> [--js | --jsx | --ts | --tsx]
semantic-react rename helper <name> <newName> [--js | --jsx | --ts | --tsx]
semantic-react rename hook <name> <newName> [--js | --jsx | --ts | --tsx]
semantic-react rename path <file> <newName> [--js | --jsx | --ts | --tsx]
```

Move a file to another path (creates the destination folder if it is missing):

```bash
semantic-react move components/Button.jsx ui/Button.jsx
```

List what is already scaffolded in the components, helpers, and hooks paths
(or pass a directory to list its tree instead):

```bash
semantic-react list
semantic-react list src/features
```

To configure where those files land, create a settings file (see
[Custom output paths](#custom-output-paths)):

```bash
semantic-react init
```

`generate` is aliased to `g`, `delete` to `d`, `rename` to `r`, `move` to `m`,
`list` to `l`, `component` to `c`, `helper` to `h`, and `hook` to `k`, so this
also works:

```bash
semantic-react g c Button --tsx
semantic-react g h formatDate --ts
semantic-react g k useToggle --tsx
semantic-react d c Button --tsx
```

### What it creates

Running `semantic-react g c Button --jsx` in your project root creates:

```
components/
  Button/
    Button.jsx
    Button.css
```

`Button.jsx`:

```jsx
export default function Button() {
  // ...
}
```

Running `semantic-react g h formatDate --jsx` creates:

```
helpers/
  formatDate.jsx
```

Running `semantic-react g k useToggle --tsx` creates:

```
hooks/
  useToggle.tsx
```

Helper and hook files share the same scaffold as components:

```jsx
export default function formatDate() {
  // ...
}
```

If a file with the same name already exists with a different extension, it is
removed so each component, helper, or hook has a single source file.

### Deleting scaffolds

Remove a scaffold with `delete` (aliased to `d`):

```bash
semantic-react delete component Button --jsx
semantic-react delete helper formatDate --ts
semantic-react delete hook useToggle --tsx
```

The extension flag selects which file to target, mirroring `generate`. With no
flag, the `.js` file is targeted:

```bash
semantic-react delete helper formatDate
```

- `delete component` removes the component's source file, its colocated
  `.css` file, and the component folder itself once nothing else is left in it.
  If you keep other files (tests, stories) in that folder, the folder stays.
- `delete helper` and `delete hook` remove the single source file.
- Custom output paths from `semantic-react.settings.json` are respected, so
  `delete` looks in the same place `generate` writes.
- If the target file does not exist, the command prints a notice and exits
  without error.

> **Deletion is permanent.** Files are removed from disk, not moved to the
> system trash. Commit your work (or rely on your editor's local history) if you
> want a way back.

### Renaming scaffolds

Rename a scaffold with `rename` (aliased to `r`):

```bash
semantic-react rename component Button PrimaryButton
semantic-react rename hook useToggle useSwitch
```

```
semantic-react rename component Button PrimaryButton
Also rename the component function from Button to PrimaryButton? (y/N) y
Renamed component:
 🟢 Button.jsx → PrimaryButton.jsx
 🟣 Button.css → PrimaryButton.css
 ✏️  function Button → PrimaryButton
```

- The current extension is kept. Pass `--js`, `--jsx`, `--ts`, or `--tsx` to
  switch it while renaming.
- `rename component` moves the source file, its colocated `.css` file, and the
  component folder; the old folder is removed once nothing else is left in it.
- You are asked whether to rename the exported function. When confirmed, every
  whole-word occurrence of the old name in the file is replaced (function
  declaration, default export, `displayName`, ...).
- Custom output paths from `semantic-react.settings.json` are respected.
- Both names must stay inside the current project; a name that points outside
  it (`../`, an absolute path) is rejected.
- If the source does not exist, or the target name is already taken, the
  command prints a notice and makes no changes.

#### Renaming a file by path

`rename component/helper/hook` look in the configured scaffold paths. To rename
a file that lives somewhere else — for example one that `move` relocated —
point `rename path` straight at it:

```bash
semantic-react rename path ui/Button.jsx PrimaryButton
```

- The file stays in its current folder; only the name changes. Any directory
  or extension you include in `<newName>` is ignored — pass `--js/--jsx/--ts/--tsx`
  to switch the extension.
- A colocated `.css` file is renamed to match.
- You are asked whether to rename the exported function, same as above.
- The path must be inside the current project.

### Moving files

Move any file to another path with `move` (aliased to `m`):

```bash
semantic-react move components/Button.jsx ui/Button.jsx
```

- Both paths are taken as given, resolved from the directory you run the
  command in.
- Both paths must stay inside the current project. A path that points outside
  it (`../`, an absolute path elsewhere) is rejected.
- If the source does not exist, the command prints a notice and does nothing.
- The destination folder is created if it is missing.
- If the destination is an existing directory (or ends with `/`), the file is
  moved into it under its current name.
- If a file already exists at the destination, you are asked before it is
  overwritten.
- If a path is missing its file extension, you are prompted for it; a
  destination that omits the extension reuses the source's.
- If the source has a colocated `.css` file next to it (a component), it moves
  too, landing beside the moved file with the matching name
  (`ui/Button.jsx` → `ui/Button.css`) so its `import './...css'` keeps working.
  If a file already sits at the CSS target, the CSS is left in place and the
  command says so.
- If moving the file empties its folder (the `components/Button/` case), the
  empty folder is removed.
- `move` never changes the file's contents. If you also want the exported
  function renamed after a move, run `semantic-react rename path` on the moved
  file.

### Listing scaffolds

See everything currently in your components, helpers, and hooks paths with
`list` (aliased to `l`):

```bash
semantic-react list
```

```
components (components)
  ├── 📁 Button
  │   ├── 🎨 Button.css
  │   └── ⚛️ Button.jsx
  └── 📁 Nav
      ├── 📁 Menu
      │   └── ⚛️ Menu.jsx
      └── ⚛️ Nav.jsx

helpers (helpers)
  └── 🟨 formatDate.js

hooks (hooks)
  └── 🟦 useToggle.ts
```

- Each section header shows the kind and the configured path.
- Entries print as a tree with connecting lines; folders (📁) are expanded
  recursively so you can see nested folders and the colocated files inside.
- Files are labelled with a language icon (⚛️ React `.jsx`/`.tsx`,
  🟦 TypeScript `.ts`, 🟨 JavaScript `.js`, 🎨 CSS).
- Custom output paths from `semantic-react.settings.json` are respected.
- A path that does not exist yet or is empty is reported as such instead of
  erroring; an empty folder shows `└── (empty)`.
- Pass a directory (`semantic-react list src/features`) to print the tree under
  that path instead of the configured scaffold paths.

### Custom output paths

By default, scaffolds are written to `components/`, `helpers/`, and `hooks/`
in your project root. To send them somewhere else, add a
`semantic-react.settings.json` file to your project root.

Run `init` to drop one in, pre-filled with the default paths:

```bash
semantic-react init
```

```json
{
  "helpers": "helpers",
  "hooks": "hooks",
  "components": "components"
}
```

`init` will not clobber an existing file; pass `--force` to overwrite it.
Then edit the paths to taste, for example:

```json
{
  "components": "src/components",
  "helpers": "src/lib/helpers",
  "hooks": "src/hooks"
}
```

With that file in place, `semantic-react g c Button --jsx` creates:

```
src/components/
  Button/
    Button.jsx
    Button.css
```

Notes:

- Every key is optional. Any key you leave out falls back to its default
  (`components`, `helpers`, `hooks`).
- If `semantic-react.settings.json` is missing entirely, the defaults are used,
  so existing projects need no changes.
- Paths are resolved relative to the directory you run the command from
  (your project root) and nested paths like `src/components` are created
  automatically.
- Unknown keys in the file are ignored.

### Options

| Flag    | Output extension |
| ------- | ---------------- |
| (none)  | `.js`            |
| `--jsx` | `.jsx`           |
| `--ts`  | `.ts`            |
| `--tsx` | `.tsx`           |

## License

ISC
