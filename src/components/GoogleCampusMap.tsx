import React, { useState } from 'react';
import { RouteResult } from '../types';
import { BUILDINGS } from '../data/campusData';
import { MapPin, Navigation, Layers, Satellite, Map as MapIcon } from 'lucide-react';

interface GoogleCampusMapProps {
  activeRoute?: RouteResult | null;
  campusLat?: number;
  campusLng?: number;
}

export const GoogleCampusMap: React.FC<GoogleCampusMapProps> = ({
  activeRoute,
  campusLat = 28.6145,
  campusLng = 77.2100
}) => {
  const [mapMode, setMapMode] = useState<'hybrid' | 'satellite' | 'roadmap'>('hybrid');
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);

  // Map mode type for Google Maps Embed API
  // t=k (satellite), t=h (hybrid), t=m (roadmap)
  const mapTypeParam = mapMode === 'satellite' ? 'k' : mapMode === 'hybrid' ? 'h' : 'm';
  const iframeSrc = `https://maps.google.com/maps?q=${campusLat},${campusLng}&z=18&t=${mapTypeParam}&output=embed`;

  return (
    <div className="relative w-full h-full glass-panel-light rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col bg-white">
      {/* Top Controls Header */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <Satellite className="w-5 h-5 text-[#1d4ed8]" />
          <div>
            <h3 className="font-l2 text-sm font-bold text-slate-900 tracking-wide">Google Satellite Campus Map</h3>
            <p className="font-l3 text-[11px] text-slate-500">Live High-Res Satellite Aerial View + Custom Landmark Markers</p>
          </div>
        </div>

        {/* Map Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setMapMode('hybrid')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mapMode === 'hybrid' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hybrid Satellite
          </button>
          <button
            onClick={() => setMapMode('roadmap')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mapMode === 'roadmap' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-300'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map View
          </button>
        </div>
      </div>

      {/* Embedded Google Map Canvas */}
      <div className="relative flex-1 w-full h-full z-0 overflow-hidden">
        <iframe
          title="Google Campus Map"
          src={iframeSrc}
          className="w-full h-full border-0 grayscale-[10%] contrast-[105%]"
          loading="lazy"
        />

        {/* Custom Landmark Badges & Pins Overlaid on Google Maps */}
        <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
          {/* Top Floating Campus Landmark Badges */}
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            {BUILDINGS.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedLandmark(b.name)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 ${
                  selectedLandmark === b.name
                    ? 'bg-[#1d4ed8] text-white border-blue-700 scale-105'
                    : 'bg-white/90 backdrop-blur-md text-slate-800 border-slate-200 hover:bg-blue-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {b.shortName}
              </button>
            ))}
          </div>

          {/* Active Navigation Route Info Box overlay */}
          {activeRoute && (
            <div className="pointer-events-auto p-4 rounded-3xl glass-card-light border border-blue-200 bg-white/95 shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Navigation className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <span className="font-l3 text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Active Route Target</span>
                  <h4 className="font-l2 text-base font-bold text-slate-900">
                    {'name' in activeRoute.destination ? activeRoute.destination.name : 'Target Destination'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div>
                  <span className="text-slate-500 block text-[10px]">Distance</span>
                  <span className="text-blue-700">{activeRoute.totalDistance}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Walking Time</span>
                  <span className="text-emerald-700">~{activeRoute.estimatedMinutes} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
