import { useState } from 'react';
import { QuirkVis } from '@ljcamargo/quirkvis-react';
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

function App() {
  const [qasm, setQasm] = useState(defaultQasm);
  const [themeName, setThemeName] = useState<keyof typeof themes>('default');

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <header className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-800 shrink-0">QuirkVis JS Demo</h1>
          
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-300 shadow-sm">
                <span className="text-sm font-medium text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
                <input 
                    type="range" 
                    min="0.1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    disabled={fit}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
            </div>

            <button
              onClick={() => setFit(!fit)}
              className={`px-4 py-2 rounded font-medium border transition-all ${
                fit ? 'bg-green-600 text-white border-green-700 shadow-inner' : 'bg-white text-gray-700 border-gray-300 shadow-sm'
              }`}
            >
              {fit ? 'Scaling: Fit Content' : 'Scaling: Manual'}
            </button>

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
              className="w-full h-[550px] p-4 font-mono text-sm bg-white border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Enter OpenQASM 3.0 code here..."
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Circuit Output</h2>
            <div className="bg-white border border-gray-300 rounded shadow-sm overflow-auto h-[550px] flex items-start relative">
              <QuirkVis 
                qasm={qasm} 
                theme={themes[themeName] as any} 
                fit={fit} 
                zoom={zoom}
                className={fit ? 'w-full' : ''} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
