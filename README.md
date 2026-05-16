# QuirkVis JS

A highly customizable Quantum Circuit SVG Visualizer for the Web and Node.js. 
This is a JavaScript/TypeScript reimplementation of the [quantum_quirkvis](https://github.com/ljcamargo/quantum_quirkvis) Python library.

## Packages

- **[`@ljcamargo/quirkvis-core`](./packages/core)**: The core rendering engine and OpenQASM 3 analyzer.
- **[`@ljcamargo/quirkvis-react`](./packages/react)**: React component for easy integration into web applications.
- **[`@ljcamargo/quirkvis-cli`](./packages/cli)**: Command-line tool for generating SVG files from QASM source.

## Features

- **OpenQASM 3 Support**: Handles gates, registers, measurements, and barriers.
- **Highly Customizable**: Uses JSON-based themes to control every aspect of the circuit's appearance.
- **Multiple Themes Included**: Default, Emoji, Matrix, and Night.
- **Responsive**: Support for fitting to container and arbitrary zoom levels.
- **Lightweight**: Optimized for performance in both browser and server environments.

## Quick Start

### Installation

For React projects:
```bash
npm install @ljcamargo/quirkvis-react
```

For Node.js or core usage:
```bash
npm install @ljcamargo/quirkvis-core
```

### Usage in React

```tsx
import { QuirkVis } from '@ljcamargo/quirkvis-react';
import { themes } from '@ljcamargo/quirkvis-core';

const qasm = `
OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
cx q[0], q[1];
`;

function App() {
  return (
    <QuirkVis 
      qasm={qasm} 
      theme={themes.default} 
      fit={true} 
    />
  );
}
```

### Usage in Node.js

```js
import { draw, themes } from '@ljcamargo/quirkvis-core';
import fs from 'fs';

const svg = draw(qasmString, themes.matrix);
fs.writeFileSync('circuit.svg', svg);
```

## Development

This project uses [Bun](https://bun.sh) for development.

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run the sample demo app
bun run sample
```

## License

MIT
