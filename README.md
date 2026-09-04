# semantic-react-cli

A small CLI that scaffolds a React component into its own folder with a
colocated CSS file.

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

`generate` is aliased to `g` and `component` to `c`, so this also works:

```bash
semantic-react g c Button --tsx
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

If a `Button` file already exists with a different extension, it is removed so
the component has a single source file.

### Options

| Flag    | Output extension |
| ------- | ---------------- |
| (none)  | `.js`            |
| `--jsx` | `.jsx`           |
| `--ts`  | `.ts`            |
| `--tsx` | `.tsx`           |

## License

ISC
