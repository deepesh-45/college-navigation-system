import React, { useEffect, useRef, useState } from 'react';
import { RouteResult } from '../types';
import { BUILDINGS, NAV_NODES } from '../data/campusData';
import { Navigation, Layers, Satellite, Map as MapIcon, Key, CheckCircle2 } from 'lucide-react';
import { loadGoogleMapsApi, getGoogleMapsApiKey } from '../services/googleMapsService';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapMode, setMapMode] = useState<'hybrid' | 'satellite' | 'roadmap'>('hybrid');
  const [customApiKey, setCustomApiKey] = useState<string>(getGoogleMapsApiKey());
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Markers and Polyline references
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // 1. Initialize Google Maps JS API Engine
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      const googleMaps = await loadGoogleMapsApi();
      if (!isMounted || !mapRef.current || !googleMaps) return;

      const map = new googleMaps.Map(mapRef.current, {
        center: { lat: campusLat, lng: campusLng },
        zoom: 18,
        mapTypeId: mapMode === 'satellite' ? googleMaps.MapTypeId.SATELLITE :
                   mapMode === 'roadmap' ? googleMaps.MapTypeId.ROADMAP : googleMaps.MapTypeId.HYBRID,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });

      setMapInstance(map);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [campusLat, campusLng]);

  // 2. Update Map Type (Hybrid / Satellite / Roadmap)
  useEffect(() => {
    if (mapInstance && window.google && window.google.maps) {
      const maps = window.google.maps;
      const type = mapMode === 'satellite' ? maps.MapTypeId.SATELLITE :
                   mapMode === 'roadmap' ? maps.MapTypeId.ROADMAP : maps.MapTypeId.HYBRID;
      mapInstance.setMapTypeId(type);
    }
  }, [mapMode, mapInstance]);

  // 3. Render Landmark Markers and Route Polyline on Google Maps Canvas
  useEffect(() => {
    if (!mapInstance || !window.google || !window.google.maps) return;
    const maps = window.google.maps;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Add Landmark Markers for Buildings
    BUILDINGS.forEach(b => {
      // Find building center GPS or fallback
      const buildingNode = NAV_NODES.find(n => n.buildingId === b.id || n.id.includes(b.id));
      const lat = buildingNode?.lat || campusLat + (b.y - 350) * 0.000003;
      const lng = buildingNode?.lng || campusLng + (b.x - 500) * 0.000003;

      const marker = new maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: b.name,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: b.color || '#2563eb',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      const infoWindow = new maps.InfoWindow({
        content: `
          <div style="padding: 6px; font-family: sans-serif; color: #0f172a;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #1d4ed8;">${b.name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">${b.description}</p>
            <span style="display: inline-block; margin-top: 6px; font-size: 10px; font-weight: bold; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px;">${b.floors} Floors</span>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw Polyline for Active Route
    if (activeRoute && activeRoute.nodes.length > 0) {
      const routePath = activeRoute.nodes
        .filter(n => typeof n.lat === 'number' && typeof n.lng === 'number')
        .map(n => ({ lat: n.lat as number, lng: n.lng as number }));

      if (routePath.length > 1) {
        polylineRef.current = new maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map: mapInstance
        });
      }
    }
  }, [mapInstance, activeRoute, campusLat, campusLng]);

  return (
    <div className="relative w-full h-full glass-panel-light rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col bg-white">
      {/* Top Controls Header */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <Satellite className="w-5 h-5 text-[#1d4ed8]" />
          <div>
            <h3 className="font-l2 text-sm font-bold text-slate-900 tracking-wide">Google Maps JavaScript API Canvas</h3>
            <p className="font-l3 text-[11px] text-slate-500">Official Google Maps JS API Engine with Markers & Polylines</p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-[#1d4ed8]" />
            API Key
          </button>

          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setMapMode('hybrid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                mapMode === 'hybrid' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Hybrid
            </button>
            <button
              onClick={() => setMapMode('roadmap')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                mapMode === 'roadmap' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Google Maps Render Div */}
      <div className="relative flex-1 w-full h-full z-0 overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />

        {/* Fallback iframe overlay if API key is loading */}
        {!mapInstance && (
          <iframe
            title="Fallback Google Map"
            src={`https://maps.google.com/maps?q=${campusLat},${campusLng}&z=18&t=${mapMode === 'roadmap' ? 'm' : 'h'}&output=embed`}
            className="w-full h-full border-0 absolute inset-0 z-1"
          />
        )}

        {/* Floating Active Route Banner */}
        {activeRoute && (
          <div className="absolute bottom-4 left-4 right-4 z-10 p-4 rounded-3xl glass-card-light border border-blue-200 bg-white/95 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Navigation className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="font-l3 text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Google Maps Polyline Route</span>
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

      {/* Google Maps API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-[#1d4ed8] border border-blue-200">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-l2 text-lg font-bold text-slate-900">Google Maps API Key</h3>
                <p className="font-l3 text-xs text-slate-500">Configure your Google Maps API Key</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">API Key:</label>
              <input
                type="text"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
              />
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                You can also set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
