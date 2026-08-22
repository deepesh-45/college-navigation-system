import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteResult, NavNode } from '../types';
import { Compass } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom Leaflet Icons
const kioskIcon = L.divIcon({
  className: 'custom-kiosk-pin',
  html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const destinationIcon = L.divIcon({
  className: 'custom-dest-pin',
  html: `<div style="background-color: #e11d48; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(225,29,72,0.8);" class="animate-bounce"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const userGpsIcon = L.divIcon({
  className: 'custom-user-gps',
  html: `<div style="background-color: #059669; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(5,150,105,0.8);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface RealCampusMapProps {
  activeRoute?: RouteResult | null;
  userGps?: { lat: number; lng: number; accuracy?: number } | null;
  onSelectNode?: (node: NavNode) => void;
}

// Map Auto-recenter helper
const MapCenterUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

export const RealCampusMap: React.FC<RealCampusMapProps> = ({ activeRoute, userGps }) => {
  // Default Campus Center (Gate 1 GPS: 28.6139, 77.2090)
  const defaultCenter: [number, number] = userGps ? [userGps.lat, userGps.lng] : [28.6145, 77.2100];

  // Extract GPS coordinates for route line
  const routeGpsPolyline: [number, number][] = activeRoute
    ? activeRoute.nodes
        .filter(n => typeof n.lat === 'number' && typeof n.lng === 'number')
        .map(n => [n.lat as number, n.lng as number])
    : [];

  const startGpsNode = activeRoute?.nodes[0];
  const targetGpsNode = activeRoute?.nodes[activeRoute.nodes.length - 1];

  return (
    <div className="relative w-full h-full glass-panel-light rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col bg-white">
      {/* Top Map Header */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <h3 className="font-l2 text-sm font-bold text-slate-900 tracking-wide">Real GPS Outdoor Campus Map</h3>
            <p className="font-l3 text-[11px] text-slate-500">Live Satellite & OpenStreetMap Canvas</p>
          </div>
        </div>

        {userGps && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-l3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live GPS Connected ({userGps.accuracy ? `±${userGps.accuracy}m` : 'Active'})
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative flex-1 w-full h-full z-0">
        <MapContainer
          center={defaultCenter}
          zoom={17}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenterUpdater center={defaultCenter} />

          {/* User Live GPS Marker */}
          {userGps && (
            <>
              <Marker position={[userGps.lat, userGps.lng]} icon={userGpsIcon}>
                <Popup>
                  <div className="font-l3 text-xs font-bold text-slate-900">
                    YOU ARE HERE (Live GPS)
                  </div>
                </Popup>
              </Marker>
              {userGps.accuracy && (
                <Circle
                  center={[userGps.lat, userGps.lng]}
                  radius={userGps.accuracy}
                  pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.15 }}
                />
              )}
            </>
          )}

          {/* Route Start Kiosk Marker */}
          {startGpsNode && startGpsNode.lat && startGpsNode.lng && (
            <Marker position={[startGpsNode.lat, startGpsNode.lng]} icon={kioskIcon}>
              <Popup>
                <div className="font-l3 text-xs font-bold text-slate-900">
                  {startGpsNode.name || 'Start Point'}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Target Destination Marker */}
          {targetGpsNode && targetGpsNode.lat && targetGpsNode.lng && (
            <Marker position={[targetGpsNode.lat, targetGpsNode.lng]} icon={destinationIcon}>
              <Popup>
                <div className="font-l3 text-xs font-bold text-slate-900">
                  {'name' in activeRoute.destination ? activeRoute.destination.name : 'Target Destination'}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Polyline Route Overlay */}
          {routeGpsPolyline.length > 1 && (
            <Polyline
              positions={routeGpsPolyline}
              pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.8, dashArray: '8, 8' }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
