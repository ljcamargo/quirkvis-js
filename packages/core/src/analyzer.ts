import { parseString } from 'qasm-ts';

export interface Register {
  name: string;
  size: number;
  type: 'qubit' | 'bit';
}

export interface QubitRef {
    name: string;
    index: number;
}

export interface Statement {
  type: 'gate' | 'measure' | 'barrier' | 'reset';
  name: string;
  qubits: QubitRef[];
  params?: any[];
  target?: QubitRef;
}

export class CircuitAnalyzer {
  private lineNums: Map<string, number> = new Map();
  private registers: Map<string, Register> = new Map();

  analyze(qasm: string) {
    // Basic cleanup
    const cleanedQasm = qasm.trim();
    const ast = parseString(cleanedQasm, 3, true) as any[];

    this.registers.clear();
    const rawStatements: any[] = [];

    // First pass: find registers and extract raw nodes
    for (const node of ast) {
      const cls = node.__className__;
      if (cls === 'QuantumDeclaration') {
        const name = node.identifier.name;
        const size = node.size.value;
        this.registers.set(name, { name, size, type: 'qubit' });
      } else if (cls === 'ClassicalDeclaration') {
        const name = node.identifier.name;
        const size = node.classicalType.size?.value ?? 1;
        this.registers.set(name, { name, size, type: 'bit' });
      } else {
          rawStatements.push(node);
      }
    }

    // Assign line numbers (Match Python's _compute_line_nums)
    let currentLine = 0;
    const sortedRegs = Array.from(this.registers.values());

    // Qubits first
    for (const reg of sortedRegs.filter(r => r.type === 'qubit')) {
        for (let i = 0; i < reg.size; i++) {
            this.lineNums.set(`${reg.name},${i}`, currentLine++);
        }
    }

    // Classical bits second
    for (const reg of sortedRegs.filter(r => r.type === 'bit')) {
        if (reg.size === 1) {
            this.lineNums.set(`${reg.name},-1`, currentLine);
            this.lineNums.set(`${reg.name},0`, currentLine++);
        } else {
            for (let i = 0; i < reg.size; i++) {
                this.lineNums.set(`${reg.name},${i}`, currentLine++);
            }
        }
    }

    // Process statements
    const statements: Statement[] = [];
    for (const node of rawStatements) {
        const cls = node.__className__;
        if (cls === 'QuantumGateCall') {
            const name = node.quantumGateName.name;
            const expandedQubits = node.qubits.flatMap((q: any) => this.expandIdentifier(q));
            statements.push({
                type: 'gate',
                name,
                qubits: expandedQubits,
                params: this.extractParams(node.parameters)
            });
        } else if (cls === 'QuantumMeasurement') {
            const expandedQubits = node.identifierList.flatMap((q: any) => this.expandIdentifier(q));
            for (const q of expandedQubits) {
                statements.push({
                    type: 'measure',
                    name: 'measure',
                    qubits: [q]
                });
            }
        } else if (cls === 'QuantumMeasurementAssignment') {
            const targets = this.expandIdentifier(node.identifier);
            const expandedQubits = node.quantumMeasurement.identifierList.flatMap((q: any) => this.expandIdentifier(q));
            // Match qubits to targets 1-to-1 if possible, else use first target
            for (let i = 0; i < expandedQubits.length; i++) {
                statements.push({
                    type: 'measure',
                    name: 'measure',
                    qubits: [expandedQubits[i]],
                    target: targets[i] ?? targets[0]
                });
            }
        } else if (cls === 'QuantumBarrier') {
            const expandedQubits = node.qubits ? node.qubits.flatMap((q: any) => this.expandIdentifier(q)) : [];
            statements.push({
                type: 'barrier',
                name: 'barrier',
                qubits: expandedQubits
            });
        }
    }

    const moments = this.computeMoments(statements);

    return {
        lineNums: Object.fromEntries(this.lineNums),
        moments,
        nLines: currentLine,
        nMoments: moments.length,
        registers: Array.from(this.registers.values())
    };
  }

  private expandIdentifier(node: any): QubitRef[] {
      const name = node.name;
      const reg = this.registers.get(name);
      if (!reg) return [];

      if (node.__className__ === 'SubscriptedIdentifier') {
          return [{ name, index: node.subscript.value }];
      } else {
          // Full register
          return Array.from({ length: reg.size }, (_, i) => ({ name, index: i }));
      }
  }

  private extractParams(parameters: any): any[] {
    if (!parameters || !parameters.args) return [];
    return parameters.args.map((arg: any) => {
        if (arg.value !== undefined) return arg.value;
        if (arg.op) {
            const left = arg.left?.name === 'pi' ? Math.PI : (arg.left?.value ?? 1);
            const right = arg.right?.value ?? 1;
            if (arg.op === '/') return left / right;
            if (arg.op === '*') return left * right;
            if (arg.op === '-') return -right;
        }
        return 0;
    });
  }

  private computeMoments(statements: Statement[]): Statement[][] {
    const depths: Record<number, number> = {};
    for (const line of this.lineNums.values()) {
        depths[line] = -1;
    }

    const moments: Statement[][] = [];

    for (const stmt of statements) {
        let lines: number[] = [];
        if (stmt.type === 'barrier' && stmt.qubits.length === 0) {
            lines = Array.from(this.lineNums.values());
        } else {
            lines = stmt.qubits.map(q => {
                const key = `${q.name},${q.index}`;
                return this.lineNums.get(key);
            }).filter(l => l !== undefined) as number[];
        }

        if (stmt.type === 'measure' && !stmt.target) {
            const defaultTarget = this.lineNums.get('c,0') ?? this.lineNums.get('c,-1');
            if (defaultTarget !== undefined) lines.push(defaultTarget);
        } else if (stmt.target) {
            const targetLine = this.lineNums.get(`${stmt.target.name},${stmt.target.index}`);
            if (targetLine !== undefined) lines.push(targetLine);
        }

        if (lines.length === 0) continue;

        const minL = Math.min(...lines);
        const maxL = Math.max(...lines);

        // Greedy scheduling logic with vertical span blocking
        let maxDepth = -1;
        // Check ALL lines in the span [minL, maxL]
        for (let l = minL; l <= maxL; l++) {
            maxDepth = Math.max(maxDepth, depths[l] ?? -1);
        }

        const depth = maxDepth + 1;
        // Block ALL lines in the span [minL, maxL] for the new depth
        for (let l = minL; l <= maxL; l++) {
            depths[l] = depth;
        }

        if (!moments[depth]) moments[depth] = [];
        moments[depth].push(stmt);
    }

    return moments.filter(m => m !== undefined);
  }
}
