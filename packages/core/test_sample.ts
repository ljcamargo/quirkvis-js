import { draw, themes } from './src';

const qasm = `OPENQASM 3.0;
include "stdgates.inc";
qubit[3] q;
bit[1] c;

h q[0];
x q[1];
y q[2];
barrier q;
cx q[0], q[1];
ccx q[0], q[1], q[2];
barrier q;
rx(pi/2) q[0];
ry(pi/4) q[1];
rz(pi/2) q[2];
barrier q;
measure q[0];`;

try {
    const svg = draw(qasm, themes.default as any);
    console.log(svg);
} catch (e) {
    console.error(e);
}
