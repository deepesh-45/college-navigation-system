import React, { useState, useEffect } from 'react';
import { Smartphone, Volume2, ArrowLeft, CheckCircle2, ChevronRight, Compass, Footprints, MapPin } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';
import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';

interface MobileViewProps {
  onBackToKiosk: () => void;
}

export const MobileView: React.FC<MobileViewProps> = ({ onBackToKiosk }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(LLM_ROUTES_KNOWLEDGE[0].id);
  const [activeRoute, setActiveRoute] = useState<LLMRouteKnowledge>(LLM_ROUTES_KNOWLEDGE[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Live Phone Sensors
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);

  // Update active route when dropdown changes
  useEffect(() => {
    const r = LLM_ROUTES_KNOWLEDGE.find(k => k.id === selectedRouteId) || LLM_ROUTES_KNOWLEDGE[0];
    setActiveRoute(r);
    setCurrentStepIndex(0);
  }, [selectedRouteId]);

  // Request Sensors
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((heading) => setCompassHeading(heading));
        sensorService.watchStepCounter((steps) => setStepCount(steps));
      }
    });
  }, []);

  // Speak active step instruction when currentStepIndex changes
  useEffect(() => {
    if (voiceEnabled && activeRoute.steps[currentStepIndex]) {
      const step = activeRoute.steps[currentStepIndex];
      speechService.speak(`Step ${step.stepNumber}: ${step.voicePrompt}`);
    }
  }, [currentStepIndex, voiceEnabled, activeRoute]);

  const activeStep = activeRoute.steps[currentStepIndex];

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

        <div className="font-patua flex items-center gap-1.5 text-sm font-bold text-[#1d4ed8]">
          <Smartphone className="w-4 h-4" />
          LLM Voice Mobile Nav
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
            voiceEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </header>

      {/* Main Navigation Cockpit Content */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {/* Destination Dropdown Selector */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase block">
            Select Destination Route:
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
          >
            {LLM_ROUTES_KNOWLEDGE.map(r => (
              <option key={r.id} value={r.id}>
                {r.destinationName} ({r.totalSteps} steps)
              </option>
            ))}
          </select>
        </div>

        {/* Active Route Summary Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30">
              LLM Voice Knowledge Route
            </span>
            <span className="text-[11px] font-bold flex items-center gap-1 text-emerald-300">
              <Footprints className="w-3.5 h-3.5" />
              {stepCount} Walked
            </span>
          </div>

          <h2 className="font-l1 text-xl font-bold mt-2 leading-tight">{activeRoute.destinationName}</h2>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">{activeRoute.overviewSummary}</p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 text-xs font-bold">
            <div>
              <span className="text-blue-200 text-[10px] block uppercase font-normal">Total Steps</span>
              <span>{activeRoute.totalSteps} steps</span>
            </div>
            <div>
              <span className="text-blue-200 text-[10px] block uppercase font-normal">Building</span>
              <span>{activeRoute.building}</span>
            </div>
            <div>
              <span className="text-blue-200 text-[10px] block uppercase font-normal">Floor</span>
              <span className="text-emerald-300">Floor {activeRoute.floor}</span>
            </div>
          </div>
        </div>

        {/* 360° Live Compass & Active Instruction Prompt */}
        {activeStep && (
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
            <div className="flex items-center gap-4">
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
                  <span>Step {activeStep.stepNumber} of {activeRoute.steps.length}</span>
                  <span>Target: {activeStep.headingText}</span>
                </div>
                <p className="font-l2 text-sm font-bold text-slate-900 leading-snug">
                  "{activeStep.instruction}"
                </p>
              </div>
            </div>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Hint: {activeStep.landmarkHint}
              </div>
            )}
          </div>
        )}

        {/* Step-by-Step Directions List */}
        <div>
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2.5">
            Step-by-Step Text Directions
          </h3>
          <div className="space-y-2">
            {activeRoute.steps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  idx === currentStepIndex
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm'
                    : idx < currentStepIndex
                    ? 'bg-slate-100/60 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === currentStepIndex ? 'bg-[#1d4ed8] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.stepNumber}
                  </span>
                  <span className="text-xs">{step.instruction}</span>
                </div>
                {idx === currentStepIndex && <ChevronRight className="w-4 h-4 text-[#1d4ed8]" />}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Footer Step Controls */}
      <footer className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between sticky bottom-0 z-20 shadow-lg">
        <button
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700"
        >
          Previous
        </button>
        
        {currentStepIndex < activeRoute.steps.length - 1 ? (
          <button
            onClick={() => setCurrentStepIndex(prev => Math.min(activeRoute.steps.length - 1, prev + 1))}
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
    </div>
  );
};
