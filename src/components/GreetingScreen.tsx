import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, UserCheck, Building2, Sparkles, ArrowRight, Compass, Smartphone, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { VantaBackground } from './VantaBackground';

interface GreetingScreenProps {
  onSelectRole: (role: string) => void;
  onOpenCollector?: () => void;
  onOpenMobileCollector?: () => void;
}

export const GreetingScreen: React.FC<GreetingScreenProps> = ({ onSelectRole, onOpenCollector, onOpenMobileCollector }) => {
  const greetings = [
    { text: 'नमस्कारम्!', font: 'font-alkatra', lang: 'Hindi', gradient: 'text-gradient-namaskaram' },
    { text: 'Hello!', font: 'font-patua', lang: 'English', gradient: 'text-gradient-hello' },
    { text: 'स्वागतम्', font: 'font-alkatra', lang: 'Sanskrit', gradient: 'text-gradient-namaskaram' },
    { text: 'Welcome!', font: 'font-patua', lang: 'English', gradient: 'text-gradient-hello' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % greetings.length);
    }, 2400);

    return () => clearInterval(timer);
  }, [greetings.length]);

  const currentGreeting = greetings[currentIndex];
  const mobileNavUrl = `${window.location.origin}/mobile`;

  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: GraduationCap,
      description: 'Find Labs, Lecture Halls, Library & HOD Cabins',
      badgeColor: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'visitor',
      title: 'Visitor / Guest',
      icon: UserCheck,
      description: 'Find Director Office, Admin Block, Parking & ATM',
      badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    {
      id: 'faculty',
      title: 'Faculty / Staff',
      icon: Building2,
      description: 'Locate Faculty Cabins, Dean Office & Pods',
      badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    {
      id: 'hackathon',
      title: 'Hackathon Guest',
      icon: Sparkles,
      description: 'Route to Hackathon Auditorium & Food Court',
      badgeColor: 'bg-amber-50 border-amber-200 text-amber-900'
    }
  ];

  return (
    <div className="w-screen h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between overflow-hidden relative selection:bg-blue-600 selection:text-white select-none">
      {/* Vanta.js Interactive Background */}
      <VantaBackground />

      {/* Ambient Light Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Top Header Branding */}
      <header className="h-16 px-6 sm:px-8 border-b border-slate-200/80 glass-panel-light flex items-center justify-between z-20 shrink-0 bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-patua text-lg font-black tracking-wide text-slate-900">SMART CAMPUS NAV</h1>
            <p className="font-l3 text-[11px] text-slate-500 font-bold tracking-wider uppercase">Gate #1 Orientation Kiosk</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMobileCollector && (
            <button
              onClick={onOpenMobileCollector}
              className="font-l3 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Record single block campus nodes with phone sensors & GPS"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Mobile Block Collector
            </button>
          )}

          {onOpenCollector && (
            <button
              onClick={onOpenCollector}
              className="font-l3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Interactive Visual Map Data Collector"
            >
              <Compass className="w-3.5 h-3.5 text-[#1d4ed8]" />
              Map Collector
            </button>
          )}

          <span className="font-l3 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            AI Voice Ready
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 z-10 overflow-hidden">
        
        {/* TOP: Alternating Hindi/English Kinetic Greeting ("Namaskaram!" / "Hello!") */}
        <div className="w-full flex flex-col items-center justify-center pt-1">
          <div className="h-24 md:h-28 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentGreeting.text}
                initial={{ opacity: 0, y: 25, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.92 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <h2 className={`${currentGreeting.font} text-5xl sm:text-6xl md:text-7xl font-black ${currentGreeting.gradient} tracking-tight drop-shadow-sm`}>
                  {currentGreeting.text}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="font-l2 text-sm sm:text-base text-slate-600 font-bold tracking-wide text-center">
            Welcome to Smart AI Campus Navigation
          </p>
        </div>

        {/* MIDDLE: "Who are you?" Profile Cards (ALL 4 IN A SINGLE HORIZONTAL LINE) */}
        <div className="w-full max-w-5xl my-auto">
          <div className="text-center mb-3">
            <h3 className="font-patua text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Who are you?
            </h3>
            <p className="font-l3 text-xs text-slate-500 font-medium">
              Select your profile to start kiosk voice navigation tailored for you
            </p>
          </div>

          {/* ALL 4 CARDS IN A SINGLE HORIZONTAL LINE (grid-cols-2 lg:grid-cols-4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {roles.map((r) => {
              const IconComp = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectRole(r.title)}
                  className="group relative p-3.5 sm:p-4 rounded-3xl glass-card-light border border-slate-200/90 bg-white hover:bg-blue-50/50 hover:border-blue-300 text-left transition-all duration-300 transform active:scale-95 shadow-md hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2.5 rounded-2xl border ${r.badgeColor} group-hover:scale-110 transition-transform`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>

                    <h4 className="font-l2 text-base font-bold text-slate-900 group-hover:text-[#1d4ed8] transition-colors">
                      {r.title}
                    </h4>
                    <p className="font-l3 text-[11px] text-slate-500 mt-1 leading-tight">
                      {r.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM: QR CODE FOR MOBILE NAVIGATION */}
        <div className="w-full max-w-3xl glass-card-light p-3.5 sm:p-4 rounded-3xl border border-blue-200 bg-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Real SVG QR Code */}
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-md shrink-0">
              <QRCodeSVG value={mobileNavUrl} size={84} level="H" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] uppercase tracking-wider font-l3">
                <Smartphone className="w-4 h-4" />
                Scan for Mobile Navigation
              </div>
              <h4 className="font-l2 text-base font-bold text-slate-900 mt-0.5">
                Take Campus Map & GPS Routing on Your Phone
              </h4>
              <p className="font-l3 text-xs text-slate-600 mt-0.5 max-w-md">
                Scan with your phone camera to view full campus map, automatic GPS positioning or manual start selection, and turn-by-turn guidance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <a
              href="/mobile"
              className="font-l2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-[#1d4ed8]" />
              Open Mobile Nav
            </a>

            <button
              onClick={() => onSelectRole('Visitor')}
              className="font-l2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
            >
              <span>Kiosk Voice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
