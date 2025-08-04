# split-times

Parse and manage orienteering split times data with Javascript/Typescript

## Installation

### Deno

```sh
deno add @orienteering-js/split-times
```

### Npm

```sh
npx jsr add @orienteering-js/split-times
```

### Yarn

```sh
yarn dlx jsr add @orienteering-js/split-times
```

### Pnpm

```sh
pnpm dlx jsr add @orienteering-js/split-times
```

### Bun

```sh
bunx jsr add @orienteering-js/split-times
```

## Usage

```ts
import { parseIofXmlSplitTimesFile } from "@orienteering-js/split-times";
import { readFileSync } from "node:fs";

const iofXmlSplitTimesFile = readFileSync("file.xml");

const xmlDocument = new DOMParser().parseFromString(
  iofXmlSplitTimesFile,
  "text/xml",
);

const [runners, error] = parseIofXmlSplitTimesFile(
  xmlDocument,
  "H21",
  "+02:00",
  "2024-05-14",
);

if (error !== null) {
  runners.forEach((runner) => {
    console.log(runner.time);
  });
}
```
