import React, { useState, useEffect } from 'react';
import { LLMVoiceCockpit } from './LLMVoiceCockpit';
import { AdminPortalView } from './AdminPortalView';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { resolveLLMVoiceQueryAsync } from '../services/llmNavigationEngine';
import { LLMRouteKnowledge, VoiceState } from '../types';
import { sensorService } from '../services/sensorService';
import { CAMPUS_LANDMARKS, CampusLandmark } from '../data/landmarksData';

import { Mic, MicOff, Navigation, Key, ArrowLeft, MapPin, AlertTriangle, CheckCircle2, Sparkles, Compass, Layers } from 'lucide-react';

interface MobileNavigationViewProps {
  userRole: string;
  onBackToGreeting: () => void;
}

export const MobileNavigationView: React.FC<MobileNavigationViewProps> = ({
  onBackToGreeting
}) => {
  // 1. Floor & Landmark Selection State
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>('landmark_floor_1_main_entrance');

  // Type-Based Destination Input
  const [destinationInput, setDestinationInput] = useState<string>('');

  // Active Navigation State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeLLMRoute, setActiveLLMRoute] = useState<LLMRouteKnowledge | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Voice & Ambiguity State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [fallbackAlert, setFallbackAlert] = useState<string | null>(null);
  const [ambiguousOptions, setAmbiguousOptions] = useState<LLMRouteKnowledge[] | null>(null);

  // Admin Portal Modal
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Available landmarks for selected floor
  const floorLandmarks: CampusLandmark[] = CAMPUS_LANDMARKS.filter(l => l.floor === selectedFloor);

  // Active selected landmark object
  const activeLandmark: CampusLandmark =
    floorLandmarks.find(l => l.id === selectedLandmarkId) ||
    floorLandmarks[0] ||
    CAMPUS_LANDMARKS[0];

  // Update selected landmark default when floor changes
  useEffect(() => {
    const defaultForFloor = CAMPUS_LANDMARKS.find(l => l.floor === selectedFloor);
    if (defaultForFloor) {
      setSelectedLandmarkId(defaultForFloor.id);
    }
  }, [selectedFloor]);

  // Handle Start Navigation Button Click
  const handleStartNavigation = async () => {
    if (!destinationInput.trim()) {
      alert('Please type or speak a destination to start navigation!');
      return;
    }

    sensorService.resetStepCounter();
    sensorService.triggerHapticFeedback([100]);
    setIsLoadingRoute(true);
    setFallbackAlert(null);
    setAmbiguousOptions(null);

    const result = await resolveLLMVoiceQueryAsync(destinationInput.trim(), activeLandmark.name);

    setIsLoadingRoute(false);

    if (result.matched && result.route) {
      setActiveLLMRoute(result.route);
      setIsNavigating(true);
      const firstStepPrompt = result.route.steps[0]?.voicePrompt || result.route.steps[0]?.instruction || activeLandmark.facingOrientation;
      speechService.speak(`Starting navigation from ${activeLandmark.name}. ${firstStepPrompt}`);
    } else {
      alert(`Could not extract landmark route from ${activeLandmark.name} to "${destinationInput}". Please check the Admin Panel maindata.md.`);
    }
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

  // Process Voice Query
  const handleProcessVoiceQuery = async (query: string) => {
    setVoiceState('processing');
    setIsLoadingRoute(true);

    const result = await resolveLLMVoiceQueryAsync(query, activeLandmark.name);
    setIsLoadingRoute(false);

    if (result.parsedIntent && result.parsedIntent.destination) {
      setDestinationInput(result.parsedIntent.destination);
    }

    if (result.matched && result.route) {
      setVoiceState('success');

      if (result.isAmbiguous && result.ambiguousMatches) {
        setAmbiguousOptions(result.ambiguousMatches);
        setFallbackAlert(null);
        speechService.speak(result.responseMessage);
      } else {
        setAmbiguousOptions(null);
        setActiveLLMRoute(result.route);
        setIsNavigating(true);
        setFallbackAlert(null);
        speechService.speak(result.responseMessage);
      }
    } else {
      setVoiceState('error');
      speechService.speak(result.responseMessage);
    }
  };

  // Select Ambiguous Option Confirmation
  const handleConfirmAmbiguousSelection = (route: LLMRouteKnowledge) => {
    setAmbiguousOptions(null);
    setActiveLLMRoute(route);
    setDestinationInput(route.destinationName);
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

      {/* 1. FLOOR & LANDMARK SELECTOR PANEL */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 shadow space-y-2 z-10">
        
        {/* Floor Selection Pills */}
        <div>
          <label className="text-[9px] font-extrabold uppercase text-slate-500 flex items-center gap-1 mb-1">
            <Layers className="w-3 h-3 text-[#1d4ed8]" />
            Select Floor:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setSelectedFloor(1);
                setIsNavigating(false);
              }}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all ${
                selectedFloor === 1
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ground Floor (Floor 1)
            </button>
            <button
              onClick={() => {
                setSelectedFloor(2);
                setIsNavigating(false);
              }}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all ${
                selectedFloor === 2
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              First Floor (Floor 2)
            </button>
          </div>
        </div>

        {/* Landmark Dropdown Selector for Selected Floor */}
        <div>
          <label className="text-[9px] font-extrabold uppercase text-slate-500 flex items-center gap-1 mb-0.5">
            <Compass className="w-3 h-3 text-amber-500" />
            Starting Landmark:
          </label>
          <select
            value={selectedLandmarkId}
            onChange={(e) => {
              setSelectedLandmarkId(e.target.value);
              setIsNavigating(false);
            }}
            className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
          >
            {floorLandmarks.map((l) => (
              <option key={l.id} value={l.id}>
                📍 {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Landmark Position & Facing Card */}
        {activeLandmark && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-sm">
            <span>🧭 <strong>Facing Rule</strong>: "{activeLandmark.facingOrientation}"</span>
          </div>
        )}

        {/* Destination Type-Based Input */}
        <div>
          <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">
            Destination:
          </label>
          <input
            type="text"
            value={destinationInput}
            onChange={(e) => {
              setDestinationInput(e.target.value);
              setIsNavigating(false);
            }}
            placeholder="e.g. Data Science Lab, Washroom, AI Lab"
            className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8] truncate"
          />
        </div>

        {/* Voice Transcript Display */}
        {transcript && (
          <p className="text-[10px] font-semibold text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-200 truncate">
            Voice: "{transcript}"
          </p>
        )}

        {/* ACTION BUTTONS: Mic Voice Input & Start Navigation */}
        <div className="flex items-center gap-2 pt-0.5">
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
            disabled={isLoadingRoute || !destinationInput.trim()}
            onClick={handleStartNavigation}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-black text-[11px] uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transform active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingRoute ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{isLoadingRoute ? 'Synthesizing...' : 'Start Navigation ➔'}</span>
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

      {/* 2. REAL-TIME COMPASS & STEP COUNTER COCKPIT */}
      <div className="z-10 flex-1 flex flex-col min-h-0">
        {activeLLMRoute ? (
          <LLMVoiceCockpit
            route={activeLLMRoute}
            isNavigating={isNavigating}
            onArrived={() => {
              speechService.speak(`You have arrived at ${activeLLMRoute.destinationName}`);
            }}
          />
        ) : (
          <div className="flex-1 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-l2 text-sm font-black text-slate-800">Ready for Landmark Navigation</h4>
              <p className="text-[11px] font-semibold text-slate-500 max-w-xs mt-1">
                Select your floor & landmark, type or speak your destination (e.g. "Data Science Lab"), then tap <strong className="text-blue-600">Start Navigation ➔</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Portal Modal */}
      {showAdminPortal && (
        <AdminPortalView
          onClose={() => setShowAdminPortal(false)}
          onRouteAdded={() => {
            setIsNavigating(false);
          }}
        />
      )}

      {/* Compact Single-Screen Footer */}
      <footer className="p-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 text-center text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider z-10">
        Smart Campus AI Navigation • Landmark Selector & Dedicated Gemini Engine
      </footer>
    </div>
  );
};
