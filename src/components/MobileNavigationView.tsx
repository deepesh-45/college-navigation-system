import React, { useState } from 'react';
import { AnimatedHeadline } from './AnimatedHeadline';
import { VoiceVisualizer } from './VoiceVisualizer';
import { LLMVoiceCockpit } from './LLMVoiceCockpit';
import { AdminPortalView } from './AdminPortalView';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { resolveLLMVoiceQuery } from '../services/llmNavigationEngine';
import { LLMRouteKnowledge, LLM_ROUTES_KNOWLEDGE } from '../data/llmRoutesKnowledge';
import { VoiceState } from '../types';

import { Sparkles, Search, Home, Compass, MapPin, ArrowLeft, Key } from 'lucide-react';

interface MobileNavigationViewProps {
  userRole: string;
  onBackToGreeting: () => void;
}

export const MobileNavigationView: React.FC<MobileNavigationViewProps> = ({
  userRole,
  onBackToGreeting
}) => {
  // Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [headlineText, setHeadlineText] = useState<string>('Where would you like to go?');
  const [subtext, setSubtext] = useState<string>('Speak your destination naturally or tap one of the popular spots below.');

  // Active LLM Route Knowledge
  const [activeLLMRoute, setActiveLLMRoute] = useState<LLMRouteKnowledge | null>(LLM_ROUTES_KNOWLEDGE[0]);
  const [textSearchInput, setTextSearchInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'navigate' | 'directory'>('navigate');
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

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
    setSubtext('Please speak clearly into your phone mic (e.g., "Where is the washroom?")');

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
        setSubtext('Please try again or use text search.');
      },
      () => {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      }
    );
  };

  // Process Query via LLM Navigation Engine
  const handleProcessVoiceQuery = (query: string) => {
    setVoiceState('processing');
    setHeadlineText('Parsing LLM Navigation Knowledge...');
    setSubtext(`Processing natural language intent for "${query}"`);

    setTimeout(() => {
      const result = resolveLLMVoiceQuery(query);

      if (result.matched && result.route) {
        setVoiceState('success');
        setActiveLLMRoute(result.route);
        setHeadlineText(result.route.destinationName);
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
        
        {/* Search Bar Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textSearchInput) handleProcessVoiceQuery(textSearchInput);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={textSearchInput}
            onChange={(e) => setTextSearchInput(e.target.value)}
            placeholder="Search washroom, lab, hod office..."
            className="w-full pl-9 pr-20 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1d4ed8] shadow-md transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1d4ed8] text-white font-bold text-xs shadow-sm"
          >
            Find
          </button>
        </form>

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
            {/* Voice Hero Section */}
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

            {/* Active LLM Route Compass & Step Cockpit */}
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
                  setActiveTab('navigate');
                  setHeadlineText(item.destinationName);
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
