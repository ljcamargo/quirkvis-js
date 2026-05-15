import { parseString } from 'qasm-ts';

const qasm = `OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
measure q[1];`;

try {
    const ast = parseString(qasm, 3, true);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
