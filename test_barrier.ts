import { parseString } from 'qasm-ts';

const qasm = `
OPENQASM 3.0;
qubit[3] q;
barrier q;
`;

try {
    const ast = parseString(qasm);
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error(e);
}
