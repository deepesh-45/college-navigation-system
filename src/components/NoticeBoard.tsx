import React from 'react';
import { Navigation, Layers, PhoneCall, Compass } from 'lucide-react';

interface NoticeBoardProps {
  onSelectDestination: (destId: string, destName: string) => void;
  onOpenMap: () => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ onSelectDestination, onOpenMap }) => {
  return (
    <aside className="w-full h-full glass-panel-light border-l border-slate-200/80 flex flex-col justify-between p-5 md:p-6 overflow-y-auto bg-white/70">
      <div>
        {/* Side Panel Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              {/* LEVEL 2 FONT */}
              <h2 className="font-l2 text-xl font-bold text-slate-900 tracking-wide">Campus Directory</h2>
              {/* LEVEL 3 FONT */}
              <p className="font-l3 text-xs text-slate-500 font-medium">Quick Destinations & Map</p>
            </div>
          </div>
          <span className="font-l3 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Kiosk #1
          </span>
        </div>

        {/* Quick Destination Chips */}
        <div className="mb-6">
          <p className="font-l3 text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            Popular Spots
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
            {[
              { id: 'R_AI_LAB', label: 'AI Lab (CS-204)' },
              { id: 'B_LIBRARY', label: 'Central Library' },
              { id: 'B_CANTEEN', label: 'Food Court' },
              { id: 'B_AUDITORIUM', label: 'Auditorium' },
              { id: 'R_HOD_CSE', label: 'HOD CSE Cabin' },
              { id: 'FACIL_ATM', label: 'Campus ATM' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => onSelectDestination(chip.id, chip.label)}
                className="font-l3 px-3.5 py-2.5 rounded-xl bg-slate-100/80 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs font-semibold text-slate-800 hover:text-blue-700 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <span className="truncate">{chip.label}</span>
                <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Route →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Full Map Button */}
        <button
          onClick={onOpenMap}
          className="font-l2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all transform active:scale-98"
        >
          <Layers className="w-4 h-4" />
          Explore Interactive 2D Map
        </button>
      </div>

      {/* Security Emergency Info */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="font-l2 font-bold text-slate-900">Campus Security</p>
              <p className="font-l3 text-[10px] text-slate-500">Emergency Desk</p>
            </div>
          </div>
          <span className="font-mono text-emerald-700 font-bold">+91 1800-CAMPUS</span>
        </div>
      </div>
    </aside>
  );
};
