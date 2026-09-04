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

`generate` is aliased to `g`, `component` to `c`, `helper` to `h`, and `hook`
to `k`, so this also works:

```bash
semantic-react g c Button --tsx
semantic-react g h formatDate --ts
semantic-react g k useToggle --tsx
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

### Options

| Flag    | Output extension |
| ------- | ---------------- |
| (none)  | `.js`            |
| `--jsx` | `.jsx`           |
| `--ts`  | `.ts`            |
| `--tsx` | `.tsx`           |

## License

ISC
