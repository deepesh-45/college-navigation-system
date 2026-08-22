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
  const [segmentSteps, setSegmentSteps] = useState<number>(0);

  const activeStep: LLMStepInstruction | undefined = route.steps[currentStepIndex];

  // Reset segment steps when step index changes
  useEffect(() => {
    sensorService.resetStepCounter();
    setSegmentSteps(0);
  }, [currentStepIndex]);

  // Sensor Watcher for Compass & Step Counter
  useEffect(() => {
    sensorService.requestSensorsPermission().then((granted) => {
      if (granted) {
        sensorService.watchOrientation((heading) => setCompassHeading(heading));
        sensorService.watchStepCounter((steps) => setSegmentSteps(steps));
      }
    });
  }, []);

  // Automatic Altitude & Floor Change Detection
  useEffect(() => {
    const stopAltitudeWatcher = sensorService.watchAltitudeFloorChange((direction) => {
      if (activeStep && (activeStep.instruction.toLowerCase().includes('stair') || activeStep.instruction.toLowerCase().includes('floor') || activeStep.instruction.toLowerCase().includes('elevator'))) {
        sensorService.triggerHapticFeedback([100, 50, 100]);
        speechService.speak(`Floor altitude change detected ${direction}. Advancing to next step.`);
        handleNextStep();
      }
    });

    return () => stopAltitudeWatcher();
  }, [currentStepIndex, activeStep]);

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
    sensorService.resetStepCounter();
    setSegmentSteps(0);

    if (currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      sensorService.playArrivalChime();
      sensorService.triggerHapticFeedback([100, 50, 100]);
      if (onArrived) onArrived();
    }
  };

  const handlePreviousStep = () => {
    sensorService.resetStepCounter();
    setSegmentSteps(0);
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="w-full flex flex-col justify-between glass-panel-light rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xl bg-white/95 backdrop-blur-md font-l3 space-y-4">
      
      {/* 1. TOP LOCATION BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-blue-200">
            <Navigation className="w-3.5 h-3.5 animate-pulse" />
            Route Loaded
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <Footprints className="w-3.5 h-3.5" />
            {segmentSteps} Segment Steps
          </span>
        </div>

        {/* Source ➔ Destination Banner */}
        <div className="flex items-center gap-2 text-xs font-bold text-blue-100 border-b border-white/20 pb-2">
          <span>{route.startPoint}</span>
          <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="text-white font-extrabold">{route.destinationName}</span>
        </div>

        {/* Highlight Text */}
        <p className="font-l2 text-xs sm:text-sm font-bold text-emerald-200 leading-snug">
          "The nearest {route.category} is at {route.destinationName}, approx {route.totalSteps} steps far."
        </p>
      </div>

      {/* 2. SINGLE STEP DISPLAY WITH COMPASS & STEPS WALKED */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Step {currentStepIndex + 1} of {route.steps.length}
          </span>
          <button
            onClick={handleSpeakCurrentStep}
            className="p-1.5 px-3 rounded-xl bg-blue-50 text-[#1d4ed8] border border-blue-200 text-xs font-bold flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Read Aloud
          </button>
        </div>

        {/* Active Step Instruction Text (Balanced Font Size) */}
        {activeStep && (
          <div className="space-y-2">
            <h4 className="font-l2 text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              "{activeStep.instruction}"
            </h4>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Hint: {activeStep.landmarkHint}
              </div>
            )}
          </div>
        )}

        {/* Live Compass Dial & Segment Steps Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-2 border-t border-slate-200/80">
          
          {/* Live Compass Wheel */}
          <div className="relative w-24 h-24 rounded-full bg-white border-2 border-blue-200 shadow-inner flex items-center justify-center shrink-0">
            <span className="absolute top-1 text-[8px] font-black text-rose-600">N (0°)</span>
            <span className="absolute bottom-1 text-[8px] font-black text-slate-400">S (180°)</span>
            <span className="absolute right-1 text-[8px] font-black text-slate-400">E (90°)</span>
            <span className="absolute left-1 text-[8px] font-black text-slate-400">W (270°)</span>

            {/* Target Direction Pointer */}
            {activeStep && (
              <div
                className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-500"
                style={{ transform: `rotate(${activeStep.headingDegrees}deg)` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-y-8 animate-ping" />
              </div>
            )}

            {/* Phone Compass Needle */}
            <Compass
              className="w-12 h-12 text-[#1d4ed8] transition-transform duration-300"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />

            <span className="absolute bottom-3 text-[8px] font-extrabold text-slate-700">
              {compassHeading}° N
            </span>
          </div>

          {/* Segment Step Counter Display */}
          <div className="text-center bg-white p-3 rounded-2xl border border-slate-200 flex-1 w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Steps Walked for This Turn:</span>
            <span className="text-2xl font-black text-[#1d4ed8] block">{segmentSteps} steps</span>
            <span className="text-[10px] font-semibold text-slate-500">
              Target: {activeStep?.stepsCount || 0} steps ({activeStep?.headingText})
            </span>
          </div>
        </div>
      </div>

      {/* 3. STEP NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between pt-1">
        <button
          disabled={currentStepIndex === 0}
          onClick={handlePreviousStep}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700"
        >
          Previous
        </button>

        {currentStepIndex < route.steps.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="px-5 py-3 rounded-2xl bg-brand-gradient text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transform active:scale-95 transition-all"
          >
            <span>Reached Step — Next ➔</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Arrived at Destination!</span>
          </button>
        )}
      </div>
    </div>
  );
};
