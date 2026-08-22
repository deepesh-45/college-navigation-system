import React, { useState, useEffect } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Compass, Volume2, Footprints, ChevronRight, CheckCircle2, MapPin, Navigation } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';

interface LLMVoiceCockpitProps {
  route: LLMRouteKnowledge;
  onArrived?: () => void;
}

export const LLMVoiceCockpit: React.FC<LLMVoiceCockpitProps> = ({ route, onArrived }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);

  const activeStep: LLMStepInstruction | undefined = route.steps[currentStepIndex];

  // Sensors Watcher
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((heading) => setCompassHeading(heading));
        sensorService.watchStepCounter((steps) => setStepCount(steps));
      }
    });
  }, []);

  // Speak active step voice prompt when step index changes
  useEffect(() => {
    if (activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  }, [currentStepIndex, activeStep]);

  const handleSpeakCurrentStep = () => {
    if (activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  };

  const handleNextStep = () => {
    sensorService.triggerHapticFeedback([60]);
    if (currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      sensorService.playArrivalChime();
      sensorService.triggerHapticFeedback([100, 50, 100]);
      if (onArrived) onArrived();
    }
  };

  return (
    <div className="w-full flex flex-col justify-between glass-panel-light rounded-3xl p-5 border border-slate-200 shadow-xl bg-white/90 backdrop-blur-md font-l3 space-y-4">
      
      {/* 1. TOP LOCATION BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-blue-200">
            <Navigation className="w-3.5 h-3.5 animate-pulse" />
            Route Loaded
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <Footprints className="w-3.5 h-3.5" />
            {stepCount > 0 ? `${stepCount} Steps Walked` : `${route.totalSteps} Steps Total`}
          </span>
        </div>

        {/* Source ➔ Destination Banner */}
        <div className="flex items-center gap-2 text-xs font-bold text-blue-100 border-b border-white/20 pb-2">
          <span>{route.startPoint}</span>
          <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="text-white font-extrabold">{route.destinationName}</span>
        </div>

        {/* Highlight Text */}
        <p className="font-l2 text-sm font-bold text-emerald-200 leading-snug">
          "The nearest {route.category} is at {route.destinationName}, approx {route.totalSteps} steps far."
        </p>
      </div>

      {/* 2. LIVE 360° COMPASS & ACTIVE TURN STEP CARD */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Live Compass & Target Heading
          </span>
          <button
            onClick={handleSpeakCurrentStep}
            className="p-2 rounded-xl bg-blue-50 text-[#1d4ed8] border border-blue-200 text-xs font-bold flex items-center gap-1"
          >
            <Volume2 className="w-4 h-4" />
            Read Aloud
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Live Compass Wheel */}
          <div className="relative w-28 h-28 rounded-full bg-white border-2 border-blue-200 shadow-inner flex items-center justify-center shrink-0">
            <span className="absolute top-1 text-[9px] font-black text-rose-600">N (0°)</span>
            <span className="absolute bottom-1 text-[9px] font-black text-slate-400">S (180°)</span>
            <span className="absolute right-1 text-[9px] font-black text-slate-400">E (90°)</span>
            <span className="absolute left-1 text-[9px] font-black text-slate-400">W (270°)</span>

            {/* Target Direction Indicator */}
            {activeStep && (
              <div
                className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-500"
                style={{ transform: `rotate(${activeStep.headingDegrees}deg)` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-y-10 animate-ping" />
              </div>
            )}

            {/* Phone Compass Needle */}
            <Compass
              className="w-14 h-14 text-[#1d4ed8] transition-transform duration-300"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />

            <span className="absolute bottom-4 text-[9px] font-extrabold text-slate-700">
              {compassHeading}° N
            </span>
          </div>

          {/* Active Step Instruction Card */}
          {activeStep && (
            <div className="flex-1 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-extrabold text-blue-700">
                <span>Step {activeStep.stepNumber} of {route.steps.length}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1d4ed8] text-[10px]">
                  Target: {activeStep.headingText}
                </span>
              </div>

              <p className="font-l2 text-base font-bold text-slate-900 leading-snug">
                "{activeStep.instruction}"
              </p>

              {activeStep.landmarkHint && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Hint: {activeStep.landmarkHint}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. STEP NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between pt-2">
        <button
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
          className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700"
        >
          Previous Step
        </button>

        {currentStepIndex < route.steps.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-3.5 rounded-2xl bg-brand-gradient text-white font-extrabold text-xs shadow-md flex items-center gap-2 transform active:scale-95 transition-all"
          >
            <span>Reached Step — Next ➔</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Arrived at Destination!</span>
          </button>
        )}
      </div>
    </div>
  );
};
