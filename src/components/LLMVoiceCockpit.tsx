import React, { useState, useEffect } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Compass, Navigation, Volume2, Footprints, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
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
  const [voiceEnabled] = useState<boolean>(true);

  const activeStep: LLMStepInstruction | undefined = route.steps[currentStepIndex];

  // Sensor Orientation & Accelerometer step watcher
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((heading) => setCompassHeading(heading));
        sensorService.watchStepCounter((steps) => setStepCount(steps));
      }
    });
  }, []);

  // Speak voice instruction when step index changes
  useEffect(() => {
    if (voiceEnabled && activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  }, [currentStepIndex, voiceEnabled, activeStep]);

  const handleSpeakCurrentStep = () => {
    if (activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between glass-panel-light rounded-3xl p-6 border border-slate-200 shadow-xl bg-white/90 backdrop-blur-md font-l3">
      {/* Top Header Card */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] to-[#6d28d9] flex items-center justify-center text-white font-bold shadow-md">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">LLM Voice Navigation</span>
            <h3 className="font-l2 text-lg font-bold text-slate-900">{route.destinationName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakCurrentStep}
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200 transition-all"
            title="Read Instruction Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5" />
            {stepCount > 0 ? `${stepCount} Steps Walked` : `${route.totalSteps} Steps Total`}
          </span>
        </div>
      </div>

      {/* Main Center Compass & Current Step Card */}
      <div className="my-6 flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
        
        {/* 360° Live Compass Wheel */}
        <div className="relative w-32 h-32 rounded-full bg-white border-2 border-blue-200 shadow-inner flex items-center justify-center shrink-0">
          <div className="absolute top-1 text-[10px] font-black text-rose-600">N (0°)</div>
          <div className="absolute bottom-1 text-[10px] font-black text-slate-400">S (180°)</div>
          <div className="absolute right-1 text-[10px] font-black text-slate-400">E (90°)</div>
          <div className="absolute left-1 text-[10px] font-black text-slate-400">W (270°)</div>

          {/* Target Heading Required Indicator */}
          {activeStep && (
            <div
              className="absolute w-full h-full flex items-center justify-center transition-transform duration-500 pointer-events-none"
              style={{ transform: `rotate(${activeStep.headingDegrees}deg)` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-y-12 animate-ping" />
            </div>
          )}

          {/* Live Phone Compass Needle */}
          <Compass
            className="w-16 h-16 text-[#1d4ed8] transition-transform duration-300"
            style={{ transform: `rotate(${compassHeading}deg)` }}
          />

          <span className="absolute bottom-6 text-[10px] font-bold text-slate-600">
            {compassHeading}° N
          </span>
        </div>

        {/* Current Active Instruction Prompt */}
        {activeStep && (
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-blue-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Step {activeStep.stepNumber} of {route.steps.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1d4ed8]">
                Target: {activeStep.headingText}
              </span>
            </div>

            <p className="font-l2 text-lg font-bold text-slate-900 leading-snug">
              "{activeStep.instruction}"
            </p>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white p-2.5 rounded-2xl border border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Landmark Hint: {activeStep.landmarkHint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step-by-Step Walking Cards Directory */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {route.steps.map((step, idx) => (
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
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                idx === currentStepIndex ? 'bg-[#1d4ed8] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {step.stepNumber}
              </span>
              <div>
                <p className="text-xs font-bold">{step.instruction}</p>
                <span className="text-[10px] text-slate-500 font-semibold">{step.stepsCount > 0 ? `${step.stepsCount} steps • ` : ''}{step.headingText}</span>
              </div>
            </div>

            {idx === currentStepIndex && <ChevronRight className="w-4 h-4 text-[#1d4ed8]" />}
          </div>
        ))}
      </div>

      {/* Footer Step Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
        <button
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700"
        >
          Previous Step
        </button>

        {currentStepIndex < route.steps.length - 1 ? (
          <button
            onClick={() => setCurrentStepIndex(prev => Math.min(route.steps.length - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onArrived}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            Arrived at Destination
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
