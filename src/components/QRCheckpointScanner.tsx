import React, { useState } from 'react';
import { QrCode, CheckCircle2, X, MapPin } from 'lucide-react';
import { NAV_NODES } from '../data/campusData';
import { NavNode } from '../types';

interface QRCheckpointScannerProps {
  onCheckpointScanned: (node: NavNode) => void;
  onClose: () => void;
}

export const QRCheckpointScanner: React.FC<QRCheckpointScannerProps> = ({ onCheckpointScanned, onClose }) => {
  const [scannedNode, setScannedNode] = useState<NavNode | null>(null);

  // Checkpoints at major campus junctions
  const checkpointNodes = NAV_NODES.filter(
    n => n.type === 'entrance' || n.type === 'junction' || n.type === 'staircase'
  );

  const handleSimulateScan = (node: NavNode) => {
    setScannedNode(node);
    setTimeout(() => {
      onCheckpointScanned(node);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-2">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="font-l1 text-2xl font-bold text-slate-900">QR Checkpoint Marker</h2>
          <p className="font-l3 text-xs text-slate-600 mt-1">
            Scan physical checkpoint markers posted at junctions to update your live position
          </p>
        </div>

        {scannedNode ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in duration-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-bounce" />
            <h3 className="font-l2 text-lg font-bold text-slate-900">Position Recalibrated!</h3>
            <p className="font-l3 text-xs text-emerald-800 font-semibold mt-1">
              Updated location to {scannedNode.name}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-l3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select/Scan Physical Checkpoint:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {checkpointNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleSimulateScan(node)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-l2 text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {node.name}
                      </h4>
                      <p className="font-l3 text-[10px] text-slate-500 capitalize">
                        Type: {node.type} • Floor {node.floorNumber}
                      </p>
                    </div>
                  </div>
                  <span className="font-l3 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Scan →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
