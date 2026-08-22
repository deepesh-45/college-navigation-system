import React, { useState, useEffect } from 'react';
import { LLMVoiceCockpit } from './LLMVoiceCockpit';
import { AdminPortalView } from './AdminPortalView';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { resolveLLMVoiceQuery } from '../services/llmNavigationEngine';
import { LLMRouteKnowledge, LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { VoiceState } from '../types';
import { sensorService } from '../services/sensorService';

import { Mic, MicOff, Navigation, Key, ArrowLeft, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MobileNavigationViewProps {
  userRole: string;
  onBackToGreeting: () => void;
}

const EMPTY_STARTER_ROUTE: LLMRouteKnowledge = {
  id: "STARTER_EMPTY_ROUTE",
  category: "facility",
  destinationName: "No Routes Yet — Use Admin Panel to Add Campus Data",
  aliases: ["admin", "add route"],
  startPoint: "CSE Block Main Entrance Lobby",
  building: "Main Campus Building",
  floor: 0,
  totalSteps: 0,
  totalDistanceMeters: 0,
  overviewSummary: "Click Admin (password: admin123) to record live compass & accelerometer step data for campus routes!",
  steps: [
    {
      stepNumber: 1,
      instruction: "Dataset is ready for campus data collection! Open the Admin Panel (top right button) to record real campus routes.",
      headingDegrees: 0,
      headingText: "North (360°)",
      stepsCount: 0,
      landmarkHint: "Admin Panel top right button",
      voicePrompt: "Dataset is ready for campus data collection. Open the Admin panel to add routes."
    }
  ]
};

export const MobileNavigationView: React.FC<MobileNavigationViewProps> = ({
  onBackToGreeting
}) => {
  const initialRoute = LLM_ROUTES_KNOWLEDGE.length > 0 ? LLM_ROUTES_KNOWLEDGE[0] : EMPTY_STARTER_ROUTE;

  // Dual Input Boxes State
  const [selectedStartPoint, setSelectedStartPoint] = useState<string>(initialRoute.startPoint);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(initialRoute.id);

  // Active Navigation State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeLLMRoute, setActiveLLMRoute] = useState<LLMRouteKnowledge>(initialRoute);

  // Voice & Ambiguity State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [fallbackAlert, setFallbackAlert] = useState<string | null>(null);
  const [ambiguousOptions, setAmbiguousOptions] = useState<LLMRouteKnowledge[] | null>(null);

  // Admin Portal Modal
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Available unique start points
  const startPoints = LLM_ROUTES_KNOWLEDGE.length > 0 
    ? Array.from(new Set(LLM_ROUTES_KNOWLEDGE.map(r => r.startPoint))) 
    : [EMPTY_STARTER_ROUTE.startPoint];

  // Sync route selection when dropdown inputs change
  useEffect(() => {
    if (LLM_ROUTES_KNOWLEDGE.length === 0) {
      setActiveLLMRoute(EMPTY_STARTER_ROUTE);
      return;
    }

    const matchedRoute = LLM_ROUTES_KNOWLEDGE.find(
      r => r.id === selectedDestinationId && r.startPoint === selectedStartPoint
    ) || LLM_ROUTES_KNOWLEDGE.find(r => r.id === selectedDestinationId) || LLM_ROUTES_KNOWLEDGE[0];

    if (matchedRoute.startPoint !== selectedStartPoint) {
      setSelectedStartPoint(matchedRoute.startPoint);
    }

    setActiveLLMRoute(matchedRoute);
  }, [selectedStartPoint, selectedDestinationId]);

  // Handle Start Navigation Button Click
  const handleStartNavigation = () => {
    sensorService.resetStepCounter();
    sensorService.triggerHapticFeedback([100]);
    setIsNavigating(true);
    setFallbackAlert(null);
    setAmbiguousOptions(null);
    speechService.speak(`Starting navigation from ${activeLLMRoute.startPoint} to ${activeLLMRoute.destinationName}. Node 1: ${activeLLMRoute.steps[0].voicePrompt}`);
  };

  // Handle Mic Click
  const handleMicClick = () => {
    if (voiceState === 'listening') {
      speechService.stopListening();
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');
    setTranscript('');
    setAmbiguousOptions(null);

    speechService.startListening(
      (finalText, isFinal) => {
        setTranscript(finalText);
        if (isFinal) {
          handleProcessVoiceQuery(finalText);
        }
      },
      (_err) => {
        setVoiceState('error');
      },
      () => {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      }
    );
  };

  // Process Voice Query with Ambiguity Confirmation
  const handleProcessVoiceQuery = (query: string) => {
    setVoiceState('processing');

    setTimeout(() => {
      const result = resolveLLMVoiceQuery(query);

      if (result.matched && result.route) {
        setVoiceState('success');

        if (result.isAmbiguous && result.ambiguousMatches) {
          setAmbiguousOptions(result.ambiguousMatches);
          setFallbackAlert(null);
          speechService.speak(result.responseMessage);
        } else if (result.isNearbyLandmarkFallback) {
          setAmbiguousOptions(null);
          setActiveLLMRoute(result.route);
          setSelectedDestinationId(result.route.id);
          setSelectedStartPoint(result.route.startPoint);
          setIsNavigating(true);
          setFallbackAlert(`⚠️ Direct route for "${query}" not found. Step 10 meters to nearby landmark "${result.nearbyLandmarkName}" to start route!`);
          speechService.speak(result.responseMessage);
        } else {
          setAmbiguousOptions(null);
          setActiveLLMRoute(result.route);
          setSelectedDestinationId(result.route.id);
          setSelectedStartPoint(result.route.startPoint);
          setIsNavigating(true);
          setFallbackAlert(null);
          speechService.speak(result.responseMessage);
        }
      } else {
        setVoiceState('error');
        speechService.speak(result.responseMessage);
      }
    }, 400);
  };

  // Select Ambiguous Option Confirmation
  const handleConfirmAmbiguousSelection = (route: LLMRouteKnowledge) => {
    setAmbiguousOptions(null);
    setActiveLLMRoute(route);
    setSelectedDestinationId(route.id);
    setSelectedStartPoint(route.startPoint);
    setIsNavigating(true);
    speechService.speak(`Confirmed selection for ${route.destinationName}. Starting navigation now.`);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between max-w-md mx-auto border-x border-slate-200 shadow-2xl font-l3 relative p-2.5 sm:p-3 space-y-2 overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Interactive Background */}
      <VantaBackground />

      {/* Quick Home & Admin Floating Bar */}
      <div className="flex items-center justify-between z-20">
        <button
          onClick={onBackToGreeting}
          className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-[11px] flex items-center gap-1 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#1d4ed8]" />
          Home
        </button>

        <span className="text-[10px] font-black tracking-wider uppercase text-[#1d4ed8]">
          CAMPUS AI NAV
        </span>

        <button
          onClick={() => setShowAdminPortal(true)}
          className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 hover:bg-slate-100 text-[#1d4ed8] font-extrabold text-[11px] flex items-center gap-1 shadow-sm"
          title="Admin Panel"
        >
          <Key className="w-3.5 h-3.5" />
          Admin
        </button>
      </div>

      {/* 1. START PAGE DIRECTLY WITH START LOCATION & DESTINATION INPUTS */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 shadow space-y-2 z-10">
        <div className="grid grid-cols-2 gap-2">
          {/* Start Point Input */}
          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5 truncate">
              Start Location:
            </label>
            <select
              value={selectedStartPoint}
              onChange={(e) => {
                setSelectedStartPoint(e.target.value);
                setIsNavigating(false);
              }}
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8] truncate"
            >
              {startPoints.map((sp, idx) => (
                <option key={idx} value={sp}>
                  📍 {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Input */}
          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5 truncate">
              Destination:
            </label>
            <select
              value={selectedDestinationId}
              onChange={(e) => {
                setSelectedDestinationId(e.target.value);
                setIsNavigating(false);
              }}
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8] truncate"
            >
              {LLM_ROUTES_KNOWLEDGE.length > 0 ? (
                LLM_ROUTES_KNOWLEDGE.map(r => (
                  <option key={r.id} value={r.id}>
                    🎯 {r.destinationName}
                  </option>
                ))
              ) : (
                <option value={EMPTY_STARTER_ROUTE.id}>
                  🎯 Add Routes via Admin Panel
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Voice Transcript Display */}
        {transcript && (
          <p className="text-[10px] font-semibold text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-200 truncate">
            Voice: "{transcript}"
          </p>
        )}

        {/* ACTION BUTTONS: Mic Voice Input & Start Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMicClick}
            className={`p-2 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-rose-600 text-white border-rose-700 animate-bounce'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title="Speak location query"
          >
            {voiceState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#1d4ed8]" />}
            <span className="text-[10px] font-extrabold">{voiceState === 'listening' ? 'Stop' : 'Voice'}</span>
          </button>

          <button
            onClick={handleStartNavigation}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-black text-[11px] uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transform active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Start Navigation ➔</span>
          </button>
        </div>
      </div>

      {/* AMBIGUITY CONFIRMATION WARNING CARD */}
      {ambiguousOptions && (
        <div className="p-2.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow space-y-1.5 z-20">
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Confirm Destination:</span>
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {ambiguousOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleConfirmAmbiguousSelection(opt)}
                className="w-full p-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-left transition-all shadow-sm flex items-center justify-between text-[11px] font-bold text-slate-900"
              >
                <span className="truncate">{opt.destinationName} ({opt.building})</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Alert Banner */}
      {fallbackAlert && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold shadow flex items-center gap-1.5 z-10 truncate">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
          <span className="truncate">{fallbackAlert}</span>
        </div>
      )}

      {/* 2. REAL-TIME 360° COMPASS & ACCELEROMETER STEP COUNTER */}
      <div className="z-10 flex-1 flex flex-col min-h-0">
        <LLMVoiceCockpit
          route={activeLLMRoute}
          isNavigating={isNavigating}
          onArrived={() => {
            speechService.speak(`You have arrived at ${activeLLMRoute.destinationName}`);
          }}
        />
      </div>

      {/* Admin Portal Modal */}
      {showAdminPortal && (
        <AdminPortalView
          onClose={() => setShowAdminPortal(false)}
          onRouteAdded={(newRoute) => {
            setActiveLLMRoute(newRoute);
            setSelectedDestinationId(newRoute.id);
            setSelectedStartPoint(newRoute.startPoint);
            setIsNavigating(true);
          }}
        />
      )}

      {/* Compact Single-Screen Footer */}
      <footer className="p-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 text-center text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider z-10">
        Smart Campus AI Navigation • Ready for Real Data Entry
      </footer>
    </div>
  );
};
