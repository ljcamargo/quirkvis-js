import { parseString } from 'qasm-ts';

const qasm = `OPENQASM 3.0;
bit[1] c;
qubit[1] q;
c[0] = measure q[0];
barrier q;`;

try {
    const ast = parseString(qasm, 3, true);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
