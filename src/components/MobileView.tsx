import React, { useState, useEffect } from 'react';
import { Smartphone, Navigation, Volume2, ArrowLeft, CheckCircle2, ChevronRight, Compass, QrCode, Footprints } from 'lucide-react';
import { gpsService, GpsPosition } from '../services/gpsService';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';
import { RealCampusMap } from './RealCampusMap';
import { QRCheckpointScanner } from './QRCheckpointScanner';
import { findRoute } from '../services/routeEngine';
import { DESTINATIONS, NAV_NODES } from '../data/campusData';
import { NavNode, RouteResult } from '../types';

interface MobileViewProps {
  onBackToKiosk: () => void;
}

export const MobileView: React.FC<MobileViewProps> = ({ onBackToKiosk }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramDest = urlParams.get('dest') || 'R_AI_LAB';

  // State Management
  const [selectedStartNode, setSelectedStartNode] = useState<string>('N_KIOSK_MAIN');
  const [selectedDestId, setSelectedDestId] = useState<string>(paramDest);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  
  // Navigation Route
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Live GPS & Sensors
  const [userGps, setUserGps] = useState<GpsPosition | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);

  // Calculate Route when start or destination changes
  useEffect(() => {
    const route = findRoute(selectedStartNode, selectedDestId);
    if (route) {
      setActiveRoute(route);
      setCurrentStep(0);
    }
  }, [selectedStartNode, selectedDestId]);

  // 1. Initialize Real GPS Watcher
  useEffect(() => {
    gpsService.watchPosition(
      (pos) => {
        setUserGps(pos);
      },
      (_err) => {
        // GPS Fallback
      }
    );

    return () => gpsService.stopWatcher();
  }, []);

  // 2. Initialize Sensors (Compass & Step Counter)
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((heading) => setCompassHeading(heading));
        sensorService.watchStepCounter((steps) => setStepCount(steps));
      }
    });
  }, []);

  // 3. Spoken Voice Guidance when Step Changes
  useEffect(() => {
    if (voiceGuidance && activeRoute && activeRoute.instructions[currentStep]) {
      speechService.speak(`Step ${currentStep + 1}: ${activeRoute.instructions[currentStep]}`);
    }
  }, [currentStep, voiceGuidance, activeRoute]);

  // Checkpoint Scanned Handler
  const handleCheckpointScanned = (node: NavNode) => {
    setShowQrScanner(false);
    setSelectedStartNode(node.id);
    speechService.speak(`Location updated to ${node.name}`);
  };

  const matchedDest = DESTINATIONS.find(d => d.id === selectedDestId || d.nodeId === selectedDestId);
  const destTitle = matchedDest ? matchedDest.name : 'Target Campus Destination';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between max-w-md mx-auto border-x border-slate-200 shadow-xl font-l3 selection:bg-blue-600 selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button
          onClick={onBackToKiosk}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kiosk
        </button>

        <div className="font-l1 flex items-center gap-1.5 text-sm font-bold text-[#1d4ed8]">
          <Smartphone className="w-4 h-4" />
          Mobile Navigation
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowQrScanner(true)}
            className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold"
            title="Scan Hallway QR Checkpoint"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setVoiceGuidance(!voiceGuidance)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              voiceGuidance ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Navigation Cockpit Content */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Origin & Destination Control Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
          {/* Location Mode Toggle: GPS vs Manual */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Location Method:
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setLocationMode('gps')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  locationMode === 'gps' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Auto GPS
              </button>
              <button
                onClick={() => setLocationMode('manual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  locationMode === 'manual' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {/* Start Location Picker */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Current Location (Start Point):
            </label>
            {locationMode === 'gps' ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  {userGps ? `GPS Active (${userGps.lat.toFixed(4)}, ${userGps.lng.toFixed(4)})` : 'Acquiring GPS Signal...'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Auto</span>
              </div>
            ) : (
              <select
                value={selectedStartNode}
                onChange={(e) => setSelectedStartNode(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
              >
                {NAV_NODES.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name || node.id} (Floor {node.floorNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destination Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Destination:
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
            >
              {DESTINATIONS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Route Summary Card */}
        {activeRoute && (
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30">
                Active Route Loaded
              </span>
              <span className="text-[11px] font-bold flex items-center gap-1 text-emerald-300">
                <Footprints className="w-3.5 h-3.5" />
                {stepCount} Steps Walked
              </span>
            </div>

            <h2 className="font-l1 text-xl font-bold mt-2 leading-tight">{destTitle}</h2>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 text-xs">
              <div>
                <span className="text-blue-100 text-[10px] block uppercase">Total Distance</span>
                <span className="text-xs font-bold">{activeRoute.totalDistance}m</span>
              </div>
              <div>
                <span className="text-blue-100 text-[10px] block uppercase">Est Walking Time</span>
                <span className="text-xs font-bold">~{activeRoute.estimatedMinutes} mins</span>
              </div>
              <div>
                <span className="text-blue-100 text-[10px] block uppercase">Waypoints</span>
                <span className="text-xs font-bold text-emerald-300">
                  {activeRoute.nodes.length} Nodes
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Direction Compass & Step Instruction */}
        {activeRoute && activeRoute.instructions[currentStep] && (
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-4">
            {/* Compass Needle Wheel */}
            <div className="relative w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <Compass
                className="w-10 h-10 text-[#1d4ed8] transition-transform duration-300"
                style={{ transform: `rotate(${compassHeading}deg)` }}
              />
              <span className="absolute top-1 text-[8px] font-bold text-rose-600">N</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-700 tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 animate-pulse" />
                  Step {currentStep + 1} of {activeRoute.instructions.length}
                </span>
                <span>Heading: {compassHeading}°</span>
              </div>
              <p className="font-l2 text-sm font-bold text-slate-900 leading-snug">
                {activeRoute.instructions[currentStep]}
              </p>
            </div>
          </div>
        )}

        {/* Real Leaflet Map View */}
        <div className="h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
          <RealCampusMap activeRoute={activeRoute} userGps={userGps} />
        </div>

        {/* Step-by-Step Directions List */}
        {activeRoute && (
          <div>
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2.5">
              Full Turn-by-Turn Route Instructions
            </h3>
            <div className="space-y-2">
              {activeRoute.instructions.map((instructionText: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    idx === currentStep
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm'
                      : idx < currentStep
                      ? 'bg-slate-100/60 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === currentStep ? 'bg-[#1d4ed8] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs">{instructionText}</span>
                  </div>
                  {idx === currentStep && <ChevronRight className="w-4 h-4 text-[#1d4ed8]" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Footer Step Controls */}
      {activeRoute && (
        <footer className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between sticky bottom-0 z-20 shadow-lg">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700"
          >
            Previous
          </button>
          
          {currentStep < activeRoute.instructions.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(activeRoute.instructions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md flex items-center gap-1"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onBackToKiosk}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1"
            >
              Arrived at Destination
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </footer>
      )}

      {/* QR Checkpoint Scanner Modal */}
      {showQrScanner && (
        <QRCheckpointScanner
          onCheckpointScanned={handleCheckpointScanned}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
};
