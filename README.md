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

To configure where those files land, create a settings file (see
[Custom output paths](#custom-output-paths)):

```bash
semantic-react init
```

`generate` is aliased to `g`, `delete` to `d`, `component` to `c`, `helper` to
`h`, and `hook` to `k`, so this also works:

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
