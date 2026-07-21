import { useState } from 'react';
import { QuirkVis } from '@ljcamargo/quirkvis-react';
import type { HoverInfo } from '@ljcamargo/quirkvis-react';
import { themes } from '@ljcamargo/quirkvis-core';

const defaultQasm = `OPENQASM 3.0;
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
measure q[0];
`;

const gateDescriptions: Record<string, string> = {
  h: 'Hadamard — creates superposition',
  x: 'Pauli-X (NOT) — bit flip',
  y: 'Pauli-Y — bit+phase flip',
  z: 'Pauli-Z — phase flip',
  s: 'S gate — sqrt(Z)',
  t: 'T gate — sqrt(S)',
  sdg: 'S† — inverse of S',
  tdg: 'T† — inverse of T',
  rx: 'Rotation around X-axis',
  ry: 'Rotation around Y-axis',
  rz: 'Rotation around Z-axis',
  cx: 'Controlled-NOT (CNOT)',
  ccx: 'Toffoli (CCNOT)',
  cz: 'Controlled-Z',
  cy: 'Controlled-Y',
  swap: 'SWAP',
  measure: 'Measurement → classical bit',
};

function App() {
  const [qasm, setQasm] = useState(defaultQasm);
  const [themeName, setThemeName] = useState<keyof typeof themes>('default');
  const [fitWidth, setFitWidth] = useState(true);
  const [fitHeight, setFitHeight] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [interactive, setInteractive] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-800 shrink-0">QuirkVis JS Demo</h1>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-300 shadow-sm">
                <span className="text-sm font-medium text-gray-600 w-24 text-center">Zoom: {Math.round(zoom * 100)}%</span>
                <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    disabled={fitWidth || fitHeight}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
            </div>

            <div className="flex gap-1 bg-white p-1 rounded border border-gray-300 shadow-sm">
                <button
                    onClick={() => setFitWidth(!fitWidth)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        fitWidth ? 'bg-green-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Fit Width
                </button>
                <button
                    onClick={() => setFitHeight(!fitHeight)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        fitHeight ? 'bg-green-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Fit Height
                </button>
            </div>

            <div className="flex gap-1 bg-white p-1 rounded border border-gray-300 shadow-sm">
              <button
                onClick={() => setInteractive(!interactive)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  interactive ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {interactive ? 'Interactive: ON' : 'Interactive: OFF'}
              </button>
            </div>

            <div className="w-px h-8 bg-gray-300 hidden xl:block"></div>

            <div className="flex gap-1 bg-white p-1 rounded border border-gray-300 shadow-sm">
                {(Object.keys(themes) as Array<keyof typeof themes>).map((name) => (
                <button
                    key={String(name)}
                    onClick={() => setThemeName(name)}
                    className={`px-3 py-1.5 rounded transition-colors text-sm font-medium ${
                    themeName === name ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {String(name).charAt(0).toUpperCase() + String(name).slice(1)}
                </button>
                ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">QASM Input</h2>
                <button
                    onClick={() => setQasm(defaultQasm)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Reset to Default
                </button>
            </div>
            <textarea
              value={qasm}
              onChange={(e) => setQasm(e.target.value)}
              className="w-full h-[430px] p-4 font-mono text-sm bg-white border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Enter OpenQASM 3.0 code here..."
            />

            {/* Hover Info Panel */}
            <div className="bg-white border border-gray-300 rounded shadow-sm p-4 min-h-[80px] text-sm transition-colors">
              {!interactive ? (
                <p className="text-gray-400 italic">Enable Interactive mode to hover over elements.</p>
              ) : hoverInfo && hoverInfo.type !== 'none' ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      hoverInfo.type === 'gate' ? 'bg-blue-500' :
                      hoverInfo.type === 'moment' ? 'bg-gray-400' :
                      hoverInfo.type === 'barrier' ? 'bg-orange-500' :
                      hoverInfo.type === 'measure' ? 'bg-red-500' :
                      hoverInfo.type === 'wire' ? 'bg-green-500' :
                      hoverInfo.type === 'label' ? 'bg-yellow-600' : 'bg-gray-300'
                    }`} />
                    <span className="font-semibold text-gray-800 capitalize">{hoverInfo.type}</span>
                    {hoverInfo.momentIndex >= 0 && (
                      <span className="text-gray-400 text-xs">Moment {hoverInfo.momentIndex}</span>
                    )}
                  </div>

                  {hoverInfo.type === 'gate' && hoverInfo.gateName && (
                    <div className="ml-4">
                      <p className="text-gray-700 font-mono text-xs">{hoverInfo.gateName.toUpperCase()}</p>
                      {hoverInfo.qubits && (
                        <p className="text-gray-500 text-xs">Qubits: {hoverInfo.qubits.join(', ')}</p>
                      )}
                      {gateDescriptions[hoverInfo.gateName] && (
                        <p className="text-gray-400 text-xs italic mt-0.5">{gateDescriptions[hoverInfo.gateName]}</p>
                      )}
                    </div>
                  )}

                  {hoverInfo.type === 'wire' && hoverInfo.lineIndex !== undefined && (
                    <p className="ml-4 text-gray-500 text-xs">Line {hoverInfo.lineIndex}</p>
                  )}

                  {hoverInfo.type === 'label' && hoverInfo.label && (
                    <p className="ml-4 text-gray-500 text-xs">{hoverInfo.label}</p>
                  )}

                  {hoverInfo.type === 'moment' && (
                    <p className="ml-4 text-gray-400 text-xs italic">Hover a gate or element for details</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Hover over any element in the circuit...</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Circuit Output</h2>
            <div className="bg-white border border-gray-300 rounded shadow-sm overflow-auto h-[550px] flex items-start relative">
              <QuirkVis
                qasm={qasm}
                theme={themes[themeName] as any}
                fitWidth={fitWidth}
                fitHeight={fitHeight}
                zoom={zoom}
                interactive={interactive}
                onHover={setHoverInfo}
                className="max-w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
