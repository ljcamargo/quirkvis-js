import { draw, themes } from './src';

const qasm = `
OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
cx q[0], q[1];
`;

try {
    const svg = draw(qasm, themes.default as any);
    console.log(svg.substring(0, 100));
} catch (e) {
    console.error(e);
}
