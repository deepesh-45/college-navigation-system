import React, { useState, useEffect } from 'react';
import { AnimatedHeadline } from './AnimatedHeadline';
import { VoiceVisualizer } from './VoiceVisualizer';
import { LLMVoiceCockpit } from './LLMVoiceCockpit';
import { AdminPortalView } from './AdminPortalView';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { resolveLLMVoiceQuery } from '../services/llmNavigationEngine';
import { LLMRouteKnowledge, LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { VoiceState } from '../types';

import { Sparkles, Home, Compass, MapPin, ArrowLeft, Key, Navigation } from 'lucide-react';

interface MobileNavigationViewProps {
  userRole: string;
  onBackToGreeting: () => void;
}

export const MobileNavigationView: React.FC<MobileNavigationViewProps> = ({
  userRole,
  onBackToGreeting
}) => {
  // Dual Input Boxes State
  const [selectedStartPoint, setSelectedStartPoint] = useState<string>('CSE Block Main Entrance Lobby');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(LLM_ROUTES_KNOWLEDGE[0].id);

  // Dynamic Headline Text & Subtext
  const [headlineText, setHeadlineText] = useState<string>('Where would you like to go?');
  const [subtext, setSubtext] = useState<string>('Select start & destination above or tap mic to speak.');

  // Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  
  // Active LLM Route
  const [activeLLMRoute, setActiveLLMRoute] = useState<LLMRouteKnowledge>(LLM_ROUTES_KNOWLEDGE[0]);
  const [fallbackAlert, setFallbackAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'navigate' | 'directory'>('navigate');
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Available unique start points and destinations
  const startPoints = Array.from(new Set(LLM_ROUTES_KNOWLEDGE.map(r => r.startPoint)));

  // Update Route when Dual Inputs change
  useEffect(() => {
    const matchedRoute = LLM_ROUTES_KNOWLEDGE.find(
      r => r.id === selectedDestinationId && r.startPoint === selectedStartPoint
    ) || LLM_ROUTES_KNOWLEDGE.find(r => r.id === selectedDestinationId) || LLM_ROUTES_KNOWLEDGE[0];

    setActiveLLMRoute(matchedRoute);
    setHeadlineText(`Route for ${matchedRoute.destinationName}`);
    setSubtext(`From ${matchedRoute.startPoint} • Total ${matchedRoute.totalSteps} steps (${matchedRoute.totalDistanceMeters}m walk)`);
  }, [selectedStartPoint, selectedDestinationId]);

  // Handle Voice Input Trigger
  const handleMicClick = () => {
    if (voiceState === 'listening') {
      speechService.stopListening();
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');
    setTranscript('');
    setHeadlineText('Listening...');
    setSubtext('Speak clearly into your phone mic (e.g., "Where is the washroom?")');

    speechService.startListening(
      (finalText, isFinal) => {
        setTranscript(finalText);
        if (isFinal) {
          handleProcessVoiceQuery(finalText);
        }
      },
      (_err) => {
        setVoiceState('error');
        setHeadlineText('Could not understand voice input');
        setSubtext('Please try again or select from the dropdowns above.');
      },
      () => {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      }
    );
  };

  // Process Voice Query via LLM Engine
  const handleProcessVoiceQuery = (query: string) => {
    setVoiceState('processing');
    setHeadlineText('Parsing Voice Query...');
    setSubtext(`Searching navigation dataset for "${query}"`);

    setTimeout(() => {
      const result = resolveLLMVoiceQuery(query);

      if (result.matched && result.route) {
        setVoiceState('success');
        setActiveLLMRoute(result.route);
        setSelectedDestinationId(result.route.id);
        setSelectedStartPoint(result.route.startPoint);
        setHeadlineText(`Route for ${result.route.destinationName}`);

        if (result.isNearbyLandmarkFallback) {
          setFallbackAlert(`⚠️ Direct route for "${query}" not found in database. Step 10 meters to nearby landmark "${result.nearbyLandmarkName}" to start route!`);
        } else {
          setFallbackAlert(null);
        }

        setSubtext(result.responseMessage);
        speechService.speak(result.responseMessage);
      } else {
        setVoiceState('error');
        setHeadlineText('Location Not Found');
        setSubtext(result.responseMessage);

        speechService.speak(result.responseMessage);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between max-w-md mx-auto border-x border-slate-200 shadow-2xl font-l3 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Interactive Background */}
      <VantaBackground />

      {/* Top App Navigation Bar */}
      <header className="p-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button
          onClick={onBackToGreeting}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Greeting
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="font-patua text-sm font-black text-slate-900 leading-none">CAMPUS NAV</h1>
            <p className="font-l3 text-[9px] text-[#1d4ed8] font-extrabold uppercase mt-0.5">{userRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAdminPortal(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1d4ed8] border border-slate-300 font-bold text-xs flex items-center gap-1"
            title="Admin Data Feeding Portal"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            onClick={onBackToGreeting}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            title="Back to Welcome Greeting"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Mobile Content Container */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto z-10">
        
        {/* DUAL INPUT BOXES (Start Location & Destination) FOR NON-VOICE USERS */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1d4ed8]">
            <Navigation className="w-4 h-4" />
            <span>Select Route Manual Inputs:</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                Current Location (Start Point):
              </label>
              <select
                value={selectedStartPoint}
                onChange={(e) => setSelectedStartPoint(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
              >
                {startPoints.map((sp, idx) => (
                  <option key={idx} value={sp}>
                    📍 {sp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                Destination:
              </label>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
              >
                {LLM_ROUTES_KNOWLEDGE.map(r => (
                  <option key={r.id} value={r.id}>
                    🎯 {r.destinationName} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation vs Directory Tab Switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('navigate')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'navigate' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            Voice Navigation
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'directory' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Location Directory
          </button>
        </div>

        {activeTab === 'navigate' ? (
          <div className="space-y-4">
            {fallbackAlert && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-md flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                <span>{fallbackAlert}</span>
              </div>
            )}

            {/* Voice Hero Section (Smaller font size for balanced mobile UX) */}
            <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-md text-center">
              <AnimatedHeadline text={headlineText} subtext={subtext} voiceState={voiceState} />
              
              <VoiceVisualizer
                voiceState={voiceState}
                onMicClick={handleMicClick}
                transcript={transcript}
              />

              {/* Quick Voice Chips */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Tap to Speak Location:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[
                    "Where is Washroom?",
                    "Take me to AI Lab",
                    "HOD CSE Office",
                    "Central Library",
                    "Food Court Canteen"
                  ].map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleProcessVoiceQuery(chip)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-[#1d4ed8] transition-all shadow-sm active:scale-95"
                    >
                      "{chip}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active LLM Route Compass & Single Step Display Cockpit */}
            {activeLLMRoute && (
              <LLMVoiceCockpit
                route={activeLLMRoute}
                onArrived={() => {
                  speechService.speak(`You have arrived at ${activeLLMRoute.destinationName}`);
                }}
              />
            )}
          </div>
        ) : (
          /* Directory Tab: List of all LLM routes */
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Available Campus Destinations</h3>
            {LLM_ROUTES_KNOWLEDGE.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveLLMRoute(item);
                  setSelectedDestinationId(item.id);
                  setSelectedStartPoint(item.startPoint);
                  setActiveTab('navigate');
                  setHeadlineText(`Route for ${item.destinationName}`);
                  setSubtext(item.overviewSummary);
                  speechService.speak(`Selected route for ${item.destinationName}. ${item.overviewSummary}`);
                }}
                className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-200">
                    {item.category}
                  </span>
                  <h4 className="font-l2 text-sm font-bold text-slate-900">{item.destinationName}</h4>
                  <p className="text-[11px] text-slate-500">{item.building} • Floor {item.floor}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1d4ed8] block">{item.totalSteps} steps</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.totalDistanceMeters}m walk</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Admin Portal Modal */}
      {showAdminPortal && (
        <AdminPortalView
          onClose={() => setShowAdminPortal(false)}
          onRouteAdded={(newRoute) => {
            setActiveLLMRoute(newRoute);
            setSelectedDestinationId(newRoute.id);
            setSelectedStartPoint(newRoute.startPoint);
            setActiveTab('navigate');
          }}
        />
      )}

      {/* Mobile Footer */}
      <footer className="p-3 bg-white border-t border-slate-200 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider z-20">
        Smart Campus AI Navigation Website • Powered by LLM & Mobile Compass
      </footer>
    </div>
  );
};
