import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, ArrowRight, Key } from 'lucide-react';
import { VantaBackground } from './VantaBackground';
import { AdminPortalView } from './AdminPortalView';

interface GreetingScreenProps {
  onSelectRole: (role: string) => void;
}

export const GreetingScreen: React.FC<GreetingScreenProps> = ({ onSelectRole }) => {
  const greetings = [
    { text: 'नमस्कारम्!', font: 'font-alkatra', lang: 'Hindi', gradient: 'text-gradient-namaskaram' },
    { text: 'Hello!', font: 'font-patua', lang: 'English', gradient: 'text-gradient-hello' },
    { text: 'स्वागतम्', font: 'font-alkatra', lang: 'Sanskrit', gradient: 'text-gradient-namaskaram' },
    { text: 'Welcome!', font: 'font-patua', lang: 'English', gradient: 'text-gradient-hello' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % greetings.length);
    }, 2400);

    return () => clearInterval(timer);
  }, [greetings.length]);

  const currentGreeting = greetings[currentIndex];

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-[#f8fafc] text-slate-900 flex flex-col justify-between overflow-hidden relative selection:bg-blue-600 selection:text-white select-none font-l3">
      {/* Vanta.js Interactive Background */}
      <VantaBackground />

      {/* Ambient Light Glows */}
      <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/3 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Header Branding */}
      <header className="h-14 sm:h-16 px-3.5 sm:px-8 border-b border-slate-200/80 glass-panel-light flex items-center justify-between z-20 shrink-0 bg-white/80">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-patua text-xs sm:text-lg font-black tracking-wide text-slate-900 leading-none">SMART CAMPUS NAV</h1>
            <p className="font-l3 text-[9px] sm:text-[11px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">AI Voice Web App</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowAdminPortal(true)}
            className="font-l3 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#1d4ed8] text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
            title="Admin Data Feeding Panel"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <span className="font-l3 px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline">AI Voice</span> Ready
          </span>
        </div>
      </header>

      {/* Main Center Hero Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 text-center max-w-xl mx-auto space-y-4 sm:space-y-8">
        
        {/* Alternating Hindi/English Kinetic Greeting ("Namaskaram!" / "Hello!") */}
        <div className="w-full flex flex-col items-center justify-center space-y-1 sm:space-y-2">
          <div className="h-20 sm:h-28 md:h-36 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentGreeting.text}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.92 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <h2 className={`${currentGreeting.font} text-4xl sm:text-6xl md:text-8xl font-black ${currentGreeting.gradient} tracking-tight drop-shadow-sm`}>
                  {currentGreeting.text}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="font-l2 text-sm sm:text-xl text-slate-800 font-bold tracking-wide">
            Welcome to Smart AI Campus Navigation
          </p>
          <p className="font-l3 text-[11px] sm:text-sm text-slate-500 font-medium max-w-md">
            Natural language LLM voice directions & 360° compass step-by-step guidance for classrooms, AI labs, faculty cabins, and restrooms.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-1 sm:pt-2">
          <button
            onClick={() => onSelectRole('Visitor')}
            className="group relative px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-3xl bg-brand-gradient text-white font-l2 text-sm sm:text-base font-extrabold shadow-xl hover:shadow-2xl transition-all transform active:scale-95 flex items-center gap-2.5 sm:gap-3 border border-white/20"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-amber-300" />
            <span>Start Voice Navigation</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="p-3 sm:p-4 bg-white/60 border-t border-slate-200/80 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider z-20">
        Smart Campus AI Navigation • Powered by LLM & Voice Speech
      </footer>

      {/* Admin Portal Modal */}
      {showAdminPortal && (
        <AdminPortalView
          onClose={() => setShowAdminPortal(false)}
          onRouteAdded={() => {
            setShowAdminPortal(false);
            onSelectRole('Admin');
          }}
        />
      )}
    </div>
  );
};
