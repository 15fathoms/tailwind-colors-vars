# Tailwind Color Variables CLI

Export all [Tailwind CSS](https://tailwindcss.com/docs/customizing-colors) default colors as reusable variables in multiple formats: `HEX`, `RGBA`, and `OKLCH`.

Supports multiple frontend stacks:
- CSS Custom Properties
- SCSS / Sass
- LESS
- Stylus

## Features

- Full Tailwind color palette extraction
- 3 color models: `hex`, `rgba`, `oklch`
- 4 output styles: `css`, `scss`, `less`, `stylus`
- Command-line interface
- Flat or organized output folders
- JSON export or direct console print

---

## Installation

### install
```bash
npm i tailwind-colors-vars
```

### Global install (optional)
```bash
npm install -g tailwind-colors-vars
```

This allows running `tailwind-colors` globally from anywhere.

---

## Usage

```bash
tailwind-colors [options]
```

### Options

| Option             | Description                                                            | Default |
|--------------------|------------------------------------------------------------------------|---------|
| `-f`, `--format`   | `hex`, `rgba`, `oklch`, or `all`                                       | all     |
| `-e`, `--ext`      | `css`, `scss`, `less`, `styl`, or `all`                                | all     |
| `-o`, `--out`      | Output directory                                                       | dist    |
| `--flat`           | Disable subfolders for output files                                    | false   |
| `--print`          | Print result to console instead of saving                              | false   |
| `--json`           | Print selected colors to JSON format in console                        | false   |
| `--json-out`       | Write JSON output to a specific file                                   | —       |
| `--silent`         | Disable logs                                                           | false   |
| `-h`, `--help`     | Show help message                                                      | —       |

---

## Examples

```bash
# Export all formats to all targets in /dist
tailwind-colors

# Export only OKLCH as CSS
tailwind-colors -f oklch -e css

# Flat export of HEX in SCSS format to a custom folder
tailwind-colors -f hex -e scss -o build --flat

# JSON output to file
tailwind-colors -f rgba --json-out ./colors.json
```

---

## Output structure

```bash
/dist/
  css/colors-oklch.css
  scss/colors-hex.scss
  less/colors-rgba.less
  styl/colors-oklch.styl
```

With `--flat`, files are written directly in the target folder:
```bash
/build/colors-oklch.css
```

---

## Development

### Run tests

```bash
npm test
```

Uses [Mocha](https://mochajs.org/) for CLI testing.

---

## License

MIT — Free to use, share and modify.

---