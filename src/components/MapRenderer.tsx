import React, { useState } from 'react';
import { BUILDINGS, NAV_NODES } from '../data/campusData';
import { RouteResult } from '../types';
import { Navigation, Compass, ZoomIn, ZoomOut, RotateCcw, Satellite, Map as MapIcon } from 'lucide-react';
import { GoogleCampusMap } from './GoogleCampusMap';

interface MapRendererProps {
  activeRoute?: RouteResult | null;
  onNodeClick?: (nodeId: string) => void;
}

export const MapRenderer: React.FC<MapRendererProps> = ({ activeRoute }) => {
  const [mapType, setMapType] = useState<'svg' | 'google_satellite'>('svg');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedBuilding(null);
  };

  // Convert route path to SVG Polyline points
  const routePoints = activeRoute?.nodes.map(n => `${n.x},${n.y}`).join(' ');

  if (mapType === 'google_satellite') {
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setMapType('svg')}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <MapIcon className="w-3.5 h-3.5 text-[#1d4ed8]" />
            Switch to 2D SVG Map
          </button>
        </div>
        <GoogleCampusMap activeRoute={activeRoute} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full glass-panel-light rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col bg-white">
      {/* Map Top Bar Controls */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <h3 className="font-l2 text-sm font-bold text-slate-900 tracking-wide">Interactive 2D Campus Map</h3>
            <p className="font-l3 text-[11px] text-slate-500">Gate #1 Kiosk Vector Graph Overlay</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Satellite Mode Switcher Button */}
          <button
            onClick={() => setMapType('google_satellite')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm mr-2"
          >
            <Satellite className="w-3.5 h-3.5" />
            Google Satellite View
          </button>

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Render Area */}
      <div className="relative flex-1 bg-[#f8fafc] overflow-hidden flex items-center justify-center p-4">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="gridLight" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
            </pattern>
            <radialGradient id="kioskPulseLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1000" height="700" fill="url(#gridLight)" />

          {/* Campus Roads and Walkways */}
          <path
            d="M 150 560 L 340 560 L 340 360 L 590 360 L 590 310 M 340 560 L 610 540 M 590 360 L 830 260 M 340 360 L 340 260"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 150 560 L 340 560 L 340 360 L 590 360 L 590 310 M 340 560 L 610 540 M 590 360 L 830 260 M 340 360 L 340 260"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="14"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />

          {/* Building Outlines */}
          {BUILDINGS.map(b => (
            <g
              key={b.id}
              onClick={() => setSelectedBuilding(b.name)}
              className="cursor-pointer transition-all duration-200 group"
            >
              <rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx="14"
                fill={b.color}
                fillOpacity={selectedBuilding === b.name ? "0.25" : "0.12"}
                stroke={b.color}
                strokeWidth="2.5"
                className="group-hover:fill-opacity-25 group-hover:stroke-width-3 transition-all"
              />
              <text
                x={b.x + b.width / 2}
                y={b.y + b.height / 2 - 8}
                textAnchor="middle"
                fill="#0f172a"
                fontSize="14"
                fontWeight="800"
                className="pointer-events-none font-l2"
              >
                {b.shortName}
              </text>
              <text
                x={b.x + b.width / 2}
                y={b.y + b.height / 2 + 12}
                textAnchor="middle"
                fill="#475569"
                fontSize="11"
                fontWeight="600"
                className="pointer-events-none font-l3"
              >
                {b.floors} {b.floors === 1 ? 'Floor' : 'Floors'}
              </text>
            </g>
          ))}

          {/* Graph Nodes */}
          {NAV_NODES.map(node => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r="4.5"
              fill={node.type === 'kiosk' ? '#2563eb' : '#94a3b8'}
              opacity="0.7"
            />
          ))}

          {/* Active Route Path Line Overlay */}
          {routePoints && (
            <>
              {/* Route Glow */}
              <polyline
                points={routePoints}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="12"
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Animated Path Line */}
              <polyline
                points={routePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="6"
                strokeDasharray="12 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </>
          )}

          {/* Start Node Pin (Kiosk) */}
          <g transform="translate(150, 560)">
            <circle r="22" fill="url(#kioskPulseLight)" className="animate-ping" />
            <circle r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
            <text x="0" y="-18" textAnchor="middle" fill="#1d4ed8" fontSize="12" fontWeight="900" className="font-l2">
              YOU ARE HERE
            </text>
          </g>

          {/* Destination Pin */}
          {activeRoute && activeRoute.nodes.length > 0 && (
            <g transform={`translate(${activeRoute.nodes[activeRoute.nodes.length - 1].x}, ${activeRoute.nodes[activeRoute.nodes.length - 1].y})`}>
              <circle r="18" fill="#e11d48" fillOpacity="0.3" className="animate-ping" />
              <circle r="9" fill="#e11d48" stroke="#ffffff" strokeWidth="2.5" />
              <text x="0" y="-16" textAnchor="middle" fill="#e11d48" fontSize="12" fontWeight="900" className="font-l2">
                DESTINATION
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Route Info Banner */}
      {activeRoute && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-l3 text-xs uppercase font-bold text-slate-500">Active Navigation Route</p>
              <h4 className="font-l2 text-base font-bold text-slate-900">
                {'name' in activeRoute.destination ? activeRoute.destination.name : 'Target Destination'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="font-l3 text-xs text-slate-500 block">Distance</span>
              <span className="font-l2 text-sm font-extrabold text-blue-700">{activeRoute.totalDistance} meters</span>
            </div>
            <div className="text-right">
              <span className="font-l3 text-xs text-slate-500 block">Est. Time</span>
              <span className="font-l2 text-sm font-extrabold text-emerald-700">~{activeRoute.estimatedMinutes} mins walk</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
