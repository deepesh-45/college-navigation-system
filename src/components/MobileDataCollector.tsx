import React, { useState, useEffect } from 'react';
import { Smartphone, MapPin, Compass, Footprints, Plus, CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import { gpsService, GpsPosition } from '../services/gpsService';
import { sensorService } from '../services/sensorService';
import { NavNode, NavEdge } from '../types';

interface CollectedNode extends NavNode {
  buildingName: string;
  roomNumber?: string;
  department?: string;
  facultyName?: string;
  categoryName: string;
  isAccessible: boolean;
}

interface CollectedEdge extends NavEdge {
  hasStairs: boolean;
  hasElevator: boolean;
  hasRamp: boolean;
}

interface MobileDataCollectorProps {
  onBack: () => void;
}

export const MobileDataCollector: React.FC<MobileDataCollectorProps> = ({ onBack }) => {
  // Mobile Sensor State
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);

  // Block Dataset State
  const [buildingName, setBuildingName] = useState<string>('Computer Science & AI Engineering Block');
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  
  const [collectedNodes, setCollectedNodes] = useState<CollectedNode[]>([]);
  const [collectedEdges, setCollectedEdges] = useState<CollectedEdge[]>([]);

  // Node Form Inputs
  const [nodeName, setNodeName] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>('Computer Science');
  const [facultyName, setFacultyName] = useState<string>('');
  const [nodeType, setNodeType] = useState<NavNode['type']>('room');
  const [isAccessible] = useState<boolean>(true);

  // Active Connection State
  const [lastNodeId, setLastNodeId] = useState<string | null>(null);
  const [edgeHasStairs, setEdgeHasStairs] = useState<boolean>(false);
  const [edgeHasElevator, setEdgeHasElevator] = useState<boolean>(false);

  // 1. Initialize Real GPS Watcher
  useEffect(() => {
    gpsService.watchPosition(
      (pos) => setGps(pos),
      (_err) => {}
    );
    return () => gpsService.stopWatcher();
  }, []);

  // 2. Initialize Sensors (Compass Heading & Step Counter)
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((h) => setCompassHeading(h));
        sensorService.watchStepCounter((s) => setStepCount(s));
      }
    });
  }, []);

  // Record Current Node from Sensors
  const handleMarkNode = () => {
    if (!nodeName.trim()) {
      alert('Please enter a Node/Room Name (e.g. AI Lab, Main Entrance, Staircase A)');
      return;
    }

    const nodeId = `N_BLOCK_F${currentFloor}_${collectedNodes.length + 1}`;
    
    // Auto-compute canvas X,Y relative position based on floor & count
    const x = 200 + (collectedNodes.length % 4) * 180;
    const y = 180 + Math.floor(collectedNodes.length / 4) * 140;

    const newNode: CollectedNode = {
      id: nodeId,
      buildingId: 'B_BLOCK_MAIN',
      buildingName,
      floorId: `F_${currentFloor}`,
      floorNumber: currentFloor,
      lat: gps?.lat || 28.6148,
      lng: gps?.lng || 77.2102,
      x,
      y,
      type: nodeType,
      name: nodeName,
      roomNumber,
      department,
      facultyName,
      categoryName: nodeType,
      isAccessible
    };

    setCollectedNodes([...collectedNodes, newNode]);

    // Automatically create path (edge) from previous node if available
    if (lastNodeId) {
      const prevNode = collectedNodes.find(n => n.id === lastNodeId);
      const estDistance = prevNode ? Math.max(5, Math.round(stepCount * 0.75) || 15) : 15;

      const newEdge: CollectedEdge = {
        from: lastNodeId,
        to: nodeId,
        distance: estDistance,
        accessible: isAccessible,
        stairs: edgeHasStairs,
        elevator: edgeHasElevator,
        hasStairs: edgeHasStairs,
        hasElevator: edgeHasElevator,
        hasRamp: isAccessible && !edgeHasStairs
      };

      setCollectedEdges([...collectedEdges, newEdge]);
    }

    setLastNodeId(nodeId);
    setNodeName('');
    setRoomNumber('');
    setFacultyName('');
    setEdgeHasStairs(false);
    setEdgeHasElevator(false);
  };

  // Export Collected Block Data File
  const handleExportDataset = () => {
    const dataPackage = {
      building: {
        id: 'B_BLOCK_MAIN',
        name: buildingName,
        totalNodes: collectedNodes.length,
        floorsMapped: Array.from(new Set(collectedNodes.map(n => n.floorNumber)))
      },
      nodes: collectedNodes,
      edges: collectedEdges,
      capturedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `single_block_${buildingName.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between max-w-md mx-auto border-x border-slate-200 shadow-2xl font-l3 selection:bg-blue-600 selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kiosk
        </button>

        <div className="font-patua flex items-center gap-1.5 text-sm font-black text-[#1d4ed8]">
          <Smartphone className="w-4 h-4" />
          Block Sensor Data Collector
        </div>

        <button
          onClick={handleExportDataset}
          disabled={collectedNodes.length === 0}
          className="p-2 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </header>

      {/* Main Sensor Cockpit & Node Form */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Live Phone Sensor Status Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* GPS Card */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <MapPin className="w-4 h-4 text-rose-600 mx-auto mb-1" />
            <span className="text-[9px] uppercase font-bold text-slate-400 block">GPS Fix</span>
            <span className="text-xs font-extrabold text-slate-900">
              {gps ? `±${gps.accuracy}m` : 'Acquiring'}
            </span>
          </div>

          {/* Compass Heading */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <Compass className="w-4 h-4 text-[#1d4ed8] mx-auto mb-1 animate-spin" style={{ animationDuration: '12s' }} />
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Heading</span>
            <span className="text-xs font-extrabold text-slate-900">{compassHeading}° N</span>
          </div>

          {/* Step Counter */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <Footprints className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Steps</span>
            <span className="text-xs font-extrabold text-slate-900">{stepCount}</span>
          </div>
        </div>

        {/* Building & Floor Configuration */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Block / Building Name:
            </label>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Demo Block
            </span>
          </div>
          <input
            type="text"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Current Floor:
            </label>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(floorNum => (
                <button
                  key={floorNum}
                  onClick={() => setCurrentFloor(floorNum)}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all ${
                    currentFloor === floorNum
                      ? 'bg-[#1d4ed8] text-white border-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {floorNum === 0 ? 'Ground' : `Floor ${floorNum}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Node Question & Field Collector */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-l2 text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#1d4ed8]" />
              Mark New Campus Node
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">
              Node #{collectedNodes.length + 1}
            </span>
          </div>

          {/* Node Category Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Node Category / Room Type:
            </label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as NavNode['type'])}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
            >
              <option value="room">Classroom / Department Room</option>
              <option value="destination">AI / Computer Lab</option>
              <option value="cabin">Faculty / HOD Cabin</option>
              <option value="entrance">Block Main Entrance</option>
              <option value="staircase">Staircase Landing</option>
              <option value="elevator">Elevator Lift Door</option>
              <option value="junction">Corridor Intersection</option>
              <option value="kiosk">Gate 1 Kiosk Point</option>
            </select>
          </div>

          {/* Node Display Name */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
              Node / Room Name: *
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="e.g. Advanced AI Lab, CS-204, Staircase B..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#1d4ed8]"
            />
          </div>

          {/* Room Number & Department (Optional) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Room No:
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="CS-204"
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Dept:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="CSE / AI"
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Faculty Name (if Cabin) */}
          {nodeType === 'cabin' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Faculty Name:
              </label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Kumar"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold"
              />
            </div>
          )}

          {/* Path Connection Properties (If connecting from previous node) */}
          {lastNodeId && (
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-indigo-900 block">
                Path Connection from Previous Node:
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={edgeHasStairs}
                    onChange={(e) => setEdgeHasStairs(e.target.checked)}
                    className="rounded border-slate-300 text-[#1d4ed8]"
                  />
                  Has Stairs
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={edgeHasElevator}
                    onChange={(e) => setEdgeHasElevator(e.target.checked)}
                    className="rounded border-slate-300 text-[#1d4ed8]"
                  />
                  Has Elevator
                </label>
              </div>
            </div>
          )}

          {/* Mark Node Button */}
          <button
            onClick={handleMarkNode}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Node & Capture GPS/Sensors</span>
          </button>
        </div>

        {/* Collected Nodes Summary Table */}
        {collectedNodes.length > 0 && (
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-l2 text-xs font-bold uppercase tracking-wider text-slate-700">
                Mapped Nodes ({collectedNodes.length})
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {collectedEdges.length} Paths Connected
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {collectedNodes.map((n, i) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{i + 1}. {n.name}</span>
                    <span className="text-[10px] text-slate-500 block">
                      Floor {n.floorNumber} • {n.type} {n.roomNumber ? `(${n.roomNumber})` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700">
                    {n.lat ? n.lat.toFixed(4) : '0.0000'}, {n.lng ? n.lng.toFixed(4) : '0.0000'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Footer Data Exporter */}
      <footer className="p-3 bg-white border-t border-slate-200 sticky bottom-0 z-20 flex items-center justify-between shadow-lg">
        <div className="text-[11px] text-slate-600 font-semibold">
          Nodes: <strong className="text-slate-900">{collectedNodes.length}</strong> | Paths: <strong className="text-slate-900">{collectedEdges.length}</strong>
        </div>

        <button
          onClick={handleExportDataset}
          disabled={collectedNodes.length === 0}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export JSON File
        </button>
      </footer>
    </div>
  );
};
