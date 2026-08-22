import React, { useState } from 'react';
import { RouteResult, NavNode } from '../types';
import { Layers } from 'lucide-react';
import { NAV_NODES, NAV_EDGES } from '../data/campusData';

interface BlockSvgMapGeneratorProps {
  activeRoute?: RouteResult | null;
  onSelectNode?: (node: NavNode) => void;
}

export const BlockSvgMapGenerator: React.FC<BlockSvgMapGeneratorProps> = ({ activeRoute }) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(0);

  // Group nodes by floor number
  const floorNodes = NAV_NODES.filter(n => n.floorNumber === selectedFloor);
  const floorEdges = NAV_EDGES.filter(e => {
    const fromN = NAV_NODES.find(n => n.id === e.from);
    const toN = NAV_NODES.find(n => n.id === e.to);
    return fromN && toN && (fromN.floorNumber === selectedFloor || toN.floorNumber === selectedFloor);
  });

  const activePathSet = new Set(activeRoute?.pathIds || []);

  return (
    <div className="relative w-full h-full glass-panel-light rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col bg-white">
      {/* Top Header Bar & Floor Switcher */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#1d4ed8]" />
          <div>
            <h3 className="font-l2 text-sm font-bold text-slate-900 tracking-wide">Interactive Block Floor Plan SVG Map</h3>
            <p className="font-l3 text-[11px] text-slate-500">Multi-Floor Building Architecture & Real Graph Nodes</p>
          </div>
        </div>

        {/* Floor Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          {[0, 1, 2].map(floorNum => (
            <button
              key={floorNum}
              onClick={() => setSelectedFloor(floorNum)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedFloor === floorNum
                  ? 'bg-[#1d4ed8] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              {floorNum === 0 ? 'Ground' : `Floor ${floorNum}`}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Multi-Floor Render Area */}
      <div className="relative flex-1 w-full h-full bg-slate-50 flex items-center justify-center p-4">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-inner"
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="blockGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1000" height="700" fill="url(#blockGrid)" />

          {/* Building Outlines for Ground Floor */}
          <rect x="220" y="140" width="600" height="460" rx="30" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6,6" />
          <text x="240" y="170" fill="#94a3b8" fontSize="14" fontWeight="bold">
            CSE Block — {selectedFloor === 0 ? 'Ground Floor Lobby' : `Floor ${selectedFloor}`}
          </text>

          {/* Edges / Corridor Connections */}
          {floorEdges.map((edge, i) => {
            const fromNode = NAV_NODES.find(n => n.id === edge.from);
            const toNode = NAV_NODES.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isRouteEdge = activePathSet.has(fromNode.id) && activePathSet.has(toNode.id);

            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isRouteEdge ? '#2563eb' : '#cbd5e1'}
                strokeWidth={isRouteEdge ? 6 : 3}
                strokeDasharray={isRouteEdge ? '8,8' : 'none'}
                className={isRouteEdge ? 'animate-pulse' : ''}
              />
            );
          })}

          {/* Nodes Rendering */}
          {floorNodes.map((node) => {
            const isStart = activeRoute?.startNode.id === node.id;
            const isDest = activeRoute?.nodes[activeRoute.nodes.length - 1]?.id === node.id;
            const isInRoute = activePathSet.has(node.id);

            return (
              <g key={node.id} className="cursor-pointer group">
                {/* Node Outer Pulsing Aura */}
                {(isStart || isDest) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={22}
                    fill={isStart ? '#2563eb' : '#e11d48'}
                    opacity={0.3}
                    className="animate-ping"
                  />
                )}

                {/* Node Point */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isStart || isDest ? 14 : isInRoute ? 10 : 8}
                  fill={
                    isStart ? '#2563eb' :
                    isDest ? '#e11d48' :
                    isInRoute ? '#059669' :
                    node.type === 'kiosk' ? '#2563eb' :
                    node.type === 'entrance' ? '#8b5cf6' : '#64748b'
                  }
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="shadow-md"
                />

                {/* Node Name Label */}
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
  );
};
