import React, { useState } from 'react';
import { AnimatedHeadline } from './AnimatedHeadline';
import { VoiceVisualizer } from './VoiceVisualizer';
import { BottomNoticeCards } from './BottomNoticeCards';
import { MapRenderer } from './MapRenderer';
import { QRCodeHandoff } from './QRCodeHandoff';
import { MobileView } from './MobileView';
import { GreetingScreen } from './GreetingScreen';
import { VantaBackground } from './VantaBackground';

import { speechService } from '../services/speechService';
import { processUserVoiceQuery } from '../services/aiService';
import { findRoute } from '../services/routeEngine';
import { RouteResult, VoiceState } from '../types';

import { QrCode, Search, Sparkles, RefreshCw, Home } from 'lucide-react';

export const KioskLayout: React.FC = () => {
  // Mobile mode check
  const isMobilePath = window.location.pathname === '/mobile' || window.location.search.includes('dest=');
  const [isMobileMode, setIsMobileMode] = useState<boolean>(isMobilePath);

  // Screen Flow Management (Screen 1: greeting, Screen 2: kiosk)
  const [currentScreen, setCurrentScreen] = useState<'greeting' | 'kiosk'>('greeting');
  const [userRole, setUserRole] = useState<string>('Visitor');

  // Kiosk Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [headlineText, setHeadlineText] = useState<string>('Where would you like to go?');
  const [subtext, setSubtext] = useState<string>('Speak your destination naturally or tap one of the popular spots below.');

  // Active Navigation & Modals
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [textSearchInput, setTextSearchInput] = useState<string>('');

  // Handle Role Selection on First Screen (GreetingScreen)
  const handleSelectRole = (role: string) => {
    setUserRole(role);
    setCurrentScreen('kiosk');
    setHeadlineText(`Welcome, ${role}! Where to?`);
    setSubtext(`Speak your destination naturally or pick a spot tailored for ${role.toLowerCase()}s.`);
    speechService.speak(`Welcome to Smart Campus Navigation! How can I help you find your location today?`);
  };

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
    setSubtext('Please speak clearly into the microphone (e.g., "Take me to the AI Lab")');

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

  // Process Query via AI Engine
  const handleProcessVoiceQuery = (query: string) => {
    setVoiceState('processing');
    setHeadlineText('Searching Campus Directory...');
    setSubtext(`Analyzing entity match for "${query}"`);

    setTimeout(() => {
      const resolution = processUserVoiceQuery(query);

      if (resolution.success && resolution.route) {
        setVoiceState('success');
        setActiveRoute(resolution.route);
        setHeadlineText(resolution.matchedEntityName || 'Route Found!');
        setSubtext(resolution.responseMessage);

        speechService.speak(resolution.responseMessage);
      } else {
        setVoiceState('error');
        setActiveRoute(null);
        setHeadlineText('Location Not Found');
        setSubtext(resolution.responseMessage);

        speechService.speak(resolution.responseMessage);
      }
    }, 600);
  };

  // Direct Destination Selection
  const handleSelectDestination = (destId: string, destName: string) => {
    setVoiceState('processing');
    setHeadlineText(`Navigating to ${destName}...`);

    setTimeout(() => {
      const route = findRoute('N_KIOSK_MAIN', destId);
      if (route) {
        setVoiceState('success');
        setActiveRoute(route);
        setHeadlineText(destName);
        setSubtext(`Shortest path calculated from Gate #1 Kiosk. Walking distance ${route.totalDistance}m.`);
        speechService.speak(`Calculated route to ${destName}. Scan the QR code to take it on your phone!`);
      }
    }, 400);
  };

  // Reset Kiosk
  const handleResetKiosk = () => {
    setVoiceState('idle');
    setTranscript('');
    setActiveRoute(null);
    setHeadlineText('Where would you like to go?');
    setSubtext('Speak your destination naturally or tap one of the popular spots below.');
  };

  if (isMobileMode) {
    return <MobileView onBackToKiosk={() => setIsMobileMode(false)} />;
  }

  // RENDER FIRST SCREEN: GREETING SCREEN
  if (currentScreen === 'greeting') {
    return <GreetingScreen onSelectRole={handleSelectRole} />;
  }

  // RENDER SECOND SCREEN: MAIN KIOSK VOICE & NAVIGATION SCREEN
  return (
    <div className="w-screen h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between overflow-hidden relative selection:bg-blue-600 selection:text-white">
      {/* Vanta.js Interactive Dots Background Animation */}
      <VantaBackground />

      {/* Ambient Light Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Kiosk Header */}
      <header className="h-16 px-6 sm:px-8 border-b border-slate-200 glass-panel-light flex items-center justify-between z-20 shrink-0 bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-patua text-lg font-black tracking-wide text-slate-900">SMART CAMPUS NAV</h1>
            <p className="font-l3 text-[11px] text-slate-500 font-bold tracking-wider uppercase">
              AI Kiosk • Gate 1 • <span className="text-[#1d4ed8] font-extrabold">{userRole}</span>
            </p>
          </div>
        </div>

        {/* Header Navigation Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('greeting')}
            className="font-l3 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Back to Welcome Greeting Screen"
          >
            <Home className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Welcome Screen</span>
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textSearchInput) handleProcessVoiceQuery(textSearchInput);
            }}
            className="relative hidden md:block w-64"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={textSearchInput}
              onChange={(e) => setTextSearchInput(e.target.value)}
              placeholder="Search building, lab, faculty..."
              className="font-l3 w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1d4ed8] transition-all shadow-inner"
            />
          </form>

          {activeRoute && (
            <button
              onClick={handleResetKiosk}
              className="font-l3 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <button
            onClick={() => setIsMobileMode(true)}
            className="font-l3 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            Mobile Mode
          </button>
        </div>
      </header>

      {/* Main Kiosk Dashboard Area (Side-by-Side: Voice Assistant Left 55% + Live Map Right 45%) */}
      <div className="flex-1 flex overflow-hidden z-10 p-4 gap-4">
        
        {/* LEFT 55%: Voice AI Assistant & Kinetic Visualizer */}
        <main className="w-full lg:w-[52%] flex flex-col items-center justify-between p-4 relative overflow-hidden select-none bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-lg">
          
          {/* Headline & Voice Status */}
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <AnimatedHeadline text={headlineText} subtext={subtext} voiceState={voiceState} />
            
            {/* Interactive Voice Visualizer */}
            <VoiceVisualizer
              voiceState={voiceState}
              onMicClick={handleMicClick}
              transcript={transcript}
            />
          </div>

          {/* Popular Voice Suggestions or Active Route Bar */}
          <div className="w-full max-w-xl mb-1">
            {activeRoute ? (
              <div className="p-3.5 rounded-2xl glass-card-light border border-blue-200 bg-white shadow-md flex items-center justify-between">
                <div>
                  <span className="font-l3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Route Ready</span>
                  <h4 className="font-l2 text-base font-bold text-slate-900">{headlineText}</h4>
                  <p className="font-l3 text-xs text-slate-600">
                    Distance: <strong className="text-[#1d4ed8]">{activeRoute.totalDistance}m</strong> • Walking time: <strong className="text-emerald-700">~{activeRoute.estimatedMinutes} mins</strong>
                  </p>
                </div>

                <button
                  onClick={() => setShowQRModal(true)}
                  className="font-l2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all transform active:scale-95 shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  Scan Phone QR
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-l3 text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Popular Voice Commands</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    "Where is the AI Lab?",
                    "Take me to the Library",
                    "Where is HOD CSE office?",
                    "Where can I get food?",
                    "Route to Hackathon Auditorium"
                  ].map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => handleProcessVoiceQuery(cmd)}
                      className="font-l3 px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#1d4ed8] transition-all shadow-sm transform active:scale-95"
                    >
                      "{cmd}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT 45%: Live Campus Map View (ALWAYS VISIBLE WITH GOOGLE SATELLITE & SVG TOGGLE) */}
        <aside className="hidden lg:block w-[48%] h-full">
          <MapRenderer activeRoute={activeRoute} />
        </aside>
      </div>

      {/* BOTTOM OF THE WINDOW: Campus Notice Cards Strip */}
      <BottomNoticeCards onSelectDestination={handleSelectDestination} />

      {/* Mobile QR Handoff Modal */}
      {showQRModal && activeRoute && (
        <QRCodeHandoff
          route={activeRoute}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};
