import React, { useState } from 'react';
import { Download, ArrowLeft, Sparkles } from 'lucide-react';
import { NavNode, NavEdge } from '../types';

interface CampusDataCollectorProps {
  onBack: () => void;
}

export const CampusDataCollector: React.FC<CampusDataCollectorProps> = ({ onBack }) => {
  const [nodes, setNodes] = useState<NavNode[]>([
    { id: 'N_KIOSK_MAIN', floorId: 'F_G', floorNumber: 0, x: 150, y: 560, type: 'kiosk', name: 'Gate 1 Kiosk' },
    { id: 'N_JUNCTION_1', floorId: 'F_G', floorNumber: 0, x: 250, y: 560, type: 'junction', name: 'South Junction' },
    { id: 'N_CSE_ENTRANCE', floorId: 'F_G', floorNumber: 0, x: 590, y: 310, type: 'entrance', name: 'CSE Block Lobby' },
  ]);

  const [edges, setEdges] = useState<NavEdge[]>([
    { from: 'N_KIOSK_MAIN', to: 'N_JUNCTION_1', distance: 30, accessible: true, stairs: false },
    { from: 'N_JUNCTION_1', to: 'N_CSE_ENTRANCE', distance: 65, accessible: true, stairs: false },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeName, setNodeName] = useState<string>('');
  const [nodeType, setNodeType] = useState<NavNode['type']>('junction');

  // Add Node on Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 700);

    const newNodeId = `N_NODE_${nodes.length + 1}`;
    const newNode: NavNode = {
      id: newNodeId,
      floorId: 'F_G',
      floorNumber: 0,
      x,
      y,
      type: nodeType,
      name: nodeName || `Point ${nodes.length + 1}`
    };

    setNodes([...nodes, newNode]);

    // Auto-connect to previously selected node if active
    if (selectedNodeId) {
      const prevNode = nodes.find(n => n.id === selectedNodeId);
      if (prevNode) {
        const dist = Math.round(Math.hypot(prevNode.x - x, prevNode.y - y) * 0.3);
        setEdges([...edges, { from: selectedNodeId, to: newNodeId, distance: Math.max(10, dist), accessible: true, stairs: false }]);
      }
    }

    setSelectedNodeId(newNodeId);
    setNodeName('');
  };

  // Export Complete Campus Dataset JSON
  const handleExportJSON = () => {
    const dataset = {
      nodes,
      edges,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campus_nodes_edges.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-screen h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between overflow-hidden font-l3 selection:bg-blue-600 selection:text-white select-none">
      {/* Header Bar */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kiosk
          </button>
          <div>
            <h1 className="font-patua text-lg font-black text-[#1d4ed8]">EXPRESS CAMPUS DATA MAPPER</h1>
            <p className="font-l3 text-[11px] text-slate-500 font-bold uppercase">Click Canvas to Place Buildings, Rooms & Paths in 1 Hour</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export Campus Dataset JSON
          </button>
        </div>
      </header>

      {/* Main Workbench: Controls + SVG Map Canvas */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 z-10">
        {/* Left Toolbar Controls */}
        <div className="w-80 bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between overflow-y-auto shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#1d4ed8]" />
              Quick Node Tool
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Node/Room Name:</label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="e.g. AI Lab CS-204, Library Entrance..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Node Category:</label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as NavNode['type'])}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
              >
                <option value="kiosk">Gate 1 Kiosk</option>
                <option value="entrance">Building Entrance</option>
                <option value="destination">Room / Lab Destination</option>
                <option value="junction">Hallway / Walkway Junction</option>
                <option value="staircase">Staircase / Elevator</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <strong className="block mb-1 font-bold">💡 How to map in 60 mins:</strong>
              1. Click anywhere on the map grid on the right to place a point.<br/>
              2. Click sequential points to automatically connect walkable paths.<br/>
              3. Click <strong>"Export Campus Dataset JSON"</strong> when finished!
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
            Total Nodes: <strong className="text-slate-900">{nodes.length}</strong> • Connected Edges: <strong className="text-slate-900">{edges.length}</strong>
          </div>
        </div>

        {/* Right SVG Campus Map Canvas */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-md relative overflow-hidden flex items-center justify-center p-2">
          <svg
            viewBox="0 0 1000 700"
            className="w-full h-full cursor-crosshair rounded-2xl bg-slate-50 border border-slate-200"
            onClick={handleCanvasClick}
          >
            {/* Grid Pattern Background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="700" fill="url(#grid)" />

            {/* Campus Edges / Walkways */}
            {edges.map((edge, i) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeDasharray="6,6"
                />
              );
            })}

            {/* Campus Nodes */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 14 : 10}
                    fill={
                      node.type === 'kiosk' ? '#2563eb' :
                      node.type === 'entrance' ? '#8b5cf6' :
                      node.type === 'destination' ? '#e11d48' : '#059669'
                    }
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                  <text
                    x={node.x}
                    y={node.y - 18}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {node.name || node.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
