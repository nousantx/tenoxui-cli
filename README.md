# TenoxUI CLI

## Installation

```sh
npm i -g @tenoxui/cli
```

Usage :

```sh
tenoxui [option]
```

## Initialization

```sh
tenoxui init
```
it will generate a tenoxui configuration file.

## Configuration

`tenoxui.config.cjs` :

```js
module.exports = {
  inputFiles: "./**/*.html",
  inputStyles: {
    ".m-1": "m-2px",
    ".m-3": "m-6px",
    ".btn": "bdr-none br-4px bg-red pv-2px ph-8px",
  },
  outputStyles: "dist/output.js",
};
```

## Run

Build :

```sh
tenoxui
```

Watch mode :

```sh
tenoxui -w
```

```sh
tenoxui --watch
```
