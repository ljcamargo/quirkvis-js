import { parseString } from 'qasm-ts';

const qasm = `
OPENQASM 3.0;
include "stdgates.inc";
qubit[1] q;
rx(pi/2) q[0];
`;

try {
    const ast = parseString(qasm);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
