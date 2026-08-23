import React, { useState } from 'react';
import { LLMVoiceCockpit } from './LLMVoiceCockpit';
import { AdminPortalView } from './AdminPortalView';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { resolveLLMVoiceQueryAsync } from '../services/llmNavigationEngine';
import { LLMRouteKnowledge, LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { VoiceState } from '../types';
import { sensorService } from '../services/sensorService';

import { Mic, MicOff, Navigation, Key, ArrowLeft, MapPin, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface MobileNavigationViewProps {
  userRole: string;
  onBackToGreeting: () => void;
}

const DEFAULT_STARTER_ROUTE: LLMRouteKnowledge = {
  id: "STARTER_DEFAULT_ROUTE",
  category: "lab",
  destinationName: "Data Science Lab",
  aliases: ["data science lab", "ds lab"],
  startPoint: "Main Entrance",
  building: "Main Campus Building",
  floor: 1,
  totalSteps: 79,
  totalDistanceMeters: 59,
  overviewSummary: "Step-by-step route to Data Science Lab synthesized from campus corpus.",
  steps: [
    {
      stepNumber: 1,
      instruction: "Move straight approx 15 steps and continue straight.",
      headingDegrees: 0,
      headingText: "continue straight",
      stepsCount: 15,
      voicePrompt: "Move straight approx 15 steps and continue straight."
    },
    {
      stepNumber: 2,
      instruction: "Move straight approx 14 steps and turn left.",
      headingDegrees: 270,
      headingText: "turn left",
      stepsCount: 14,
      voicePrompt: "Move straight approx 14 steps and turn left."
    },
    {
      stepNumber: 3,
      instruction: "Move straight approx 20 steps and continue straight.",
      headingDegrees: 0,
      headingText: "continue straight",
      stepsCount: 20,
      voicePrompt: "Move straight approx 20 steps and continue straight."
    },
    {
      stepNumber: 4,
      instruction: "Move straight approx 20 steps and take stairs up.",
      headingDegrees: 0,
      headingText: "take stairs up",
      stepsCount: 20,
      voicePrompt: "Move straight approx 20 steps and take stairs up."
    },
    {
      stepNumber: 5,
      instruction: "Move straight approx 10 steps to reach Data Science Lab.",
      headingDegrees: 0,
      headingText: "continue straight",
      stepsCount: 10,
      voicePrompt: "Move straight approx 10 steps to reach Data Science Lab."
    }
  ]
};

export const MobileNavigationView: React.FC<MobileNavigationViewProps> = ({
  onBackToGreeting
}) => {
  const initialRoute = LLM_ROUTES_KNOWLEDGE.length > 0 ? LLM_ROUTES_KNOWLEDGE[0] : DEFAULT_STARTER_ROUTE;

  // Type-Based Input Text Fields (Not locked dropdown selection)
  const [startPointInput, setStartPointInput] = useState<string>(initialRoute.startPoint);
  const [destinationInput, setDestinationInput] = useState<string>(initialRoute.destinationName);

  // Active Navigation State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeLLMRoute, setActiveLLMRoute] = useState<LLMRouteKnowledge>(initialRoute);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Voice & Ambiguity State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [fallbackAlert, setFallbackAlert] = useState<string | null>(null);
  const [ambiguousOptions, setAmbiguousOptions] = useState<LLMRouteKnowledge[] | null>(null);

  // Admin Portal Modal
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Handle Start Navigation Button Click (Fetches direct corpus steps between type-based Start Point & Destination)
  const handleStartNavigation = async () => {
    if (!destinationInput.trim()) return;

    sensorService.resetStepCounter();
    sensorService.triggerHapticFeedback([100]);
    setIsLoadingRoute(true);
    setFallbackAlert(null);
    setAmbiguousOptions(null);

    const result = await resolveLLMVoiceQueryAsync(destinationInput, startPointInput);

    setIsLoadingRoute(false);

    if (result.matched && result.route) {
      setActiveLLMRoute(result.route);
      setIsNavigating(true);
      const firstStepPrompt = result.route.steps[0]?.voicePrompt || result.route.steps[0]?.instruction || 'Proceed straight';
      speechService.speak(`Starting navigation from ${result.route.startPoint} to ${result.route.destinationName}. Step 1: ${firstStepPrompt}`);
    } else {
      setIsNavigating(true);
      speechService.speak(`Starting navigation to ${destinationInput}.`);
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

  // Process Voice Query: Gemini API decodes startPoint and destination, updates text inputs, and starts navigation
  const handleProcessVoiceQuery = async (query: string) => {
    setVoiceState('processing');
    setIsLoadingRoute(true);

    const result = await resolveLLMVoiceQueryAsync(query);
    setIsLoadingRoute(false);

    if (result.parsedIntent) {
      setStartPointInput(result.parsedIntent.startPoint);
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
    setStartPointInput(route.startPoint);
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

      {/* 1. TYPE-BASED INPUT FIELDS (START LOCATION & DESTINATION) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 shadow space-y-2 z-10">
        <div className="grid grid-cols-2 gap-2">
          {/* Start Point Type-Based Text Input */}
          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5 truncate">
              Start Location:
            </label>
            <input
              type="text"
              value={startPointInput}
              onChange={(e) => {
                setStartPointInput(e.target.value);
                setIsNavigating(false);
              }}
              placeholder="e.g. Main Entrance, Hallway Junction"
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8] truncate"
            />
          </div>

          {/* Destination Type-Based Text Input */}
          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5 truncate">
              Destination:
            </label>
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => {
                setDestinationInput(e.target.value);
                setIsNavigating(false);
              }}
              placeholder="e.g. Data Science Lab, Washroom"
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8] truncate"
            />
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
            disabled={isLoadingRoute}
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
            setStartPointInput(newRoute.startPoint);
            setDestinationInput(newRoute.destinationName);
            setIsNavigating(true);
          }}
        />
      )}

      {/* Compact Single-Screen Footer */}
      <footer className="p-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 text-center text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider z-10">
        Smart Campus AI Navigation • Gemini AI Intent Parser & Corpus Engine
      </footer>
    </div>
  );
};
