import { parseString } from 'qasm-ts';

const qasm = `
OPENQASM 3.0;
qubit[1] q;
bit[1] c;
measure q[0] -> c[0];
`;

try {
    const ast = parseString(qasm);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
