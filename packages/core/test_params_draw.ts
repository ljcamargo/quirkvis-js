import { draw, themes } from './src';

const qasm = `
OPENQASM 3.0;
include "stdgates.inc";
qubit[3] q;
rx(pi/2) q[0];
ry(pi/4) q[1];
rz(pi/2) q[2];
`;

try {
    const svg = draw(qasm, themes.default as any);
    console.log(svg);
} catch (e) {
    console.error(e);
}
