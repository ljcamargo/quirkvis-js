import { parseString } from 'qasm-ts';

const qasm = `
OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
cx q[0], q[1];
`;

try {
    const ast = parseString(qasm);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
