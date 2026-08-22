import React, { useState, useEffect } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Compass, Volume2, CheckCircle2, MapPin } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';

interface LLMVoiceCockpitProps {
  route: LLMRouteKnowledge;
  isNavigating?: boolean;
  onArrived?: () => void;
}

export const LLMVoiceCockpit: React.FC<LLMVoiceCockpitProps> = ({ route, isNavigating = false, onArrived }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [segmentSteps, setSegmentSteps] = useState<number>(0);

  const activeStep: LLMStepInstruction | undefined = route.steps[currentStepIndex];

  // Reset step index & accelerometer when route changes
  useEffect(() => {
    setCurrentStepIndex(0);
    sensorService.resetStepCounter();
    setSegmentSteps(0);
  }, [route.id]);

  // Reset segment steps when step index (node) changes
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

  // Automatic Altitude & Floor Change Detection at Staircase/Elevator Nodes
  useEffect(() => {
    const stopAltitudeWatcher = sensorService.watchAltitudeFloorChange((direction) => {
      if (activeStep && (activeStep.instruction.toLowerCase().includes('stair') || activeStep.instruction.toLowerCase().includes('floor') || activeStep.instruction.toLowerCase().includes('elevator'))) {
        sensorService.triggerHapticFeedback([100, 50, 100]);
        speechService.speak(`Floor altitude change detected ${direction}. Advancing to next node.`);
        handleNextStep();
      }
    });

    return () => stopAltitudeWatcher();
  }, [currentStepIndex, activeStep]);

  // Speak active node step voice prompt
  useEffect(() => {
    if (isNavigating && activeStep) {
      speechService.speak(`Node ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  }, [currentStepIndex, activeStep, isNavigating]);

  const handleSpeakCurrentStep = () => {
    if (activeStep) {
      speechService.speak(`Node ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
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
    <div className="w-full flex-1 flex flex-col justify-between rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-md bg-white/95 backdrop-blur-md font-l3 space-y-2 overflow-hidden">
      


      {/* 2. ACTIVE NODE INSTRUCTION & REAL-TIME SENSORS */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
            Node {currentStepIndex + 1} of {route.steps.length}
          </span>
          <button
            onClick={handleSpeakCurrentStep}
            className="p-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Volume2 className="w-3 h-3" />
            Read Aloud
          </button>
        </div>

        {/* Node Turn / Instruction */}
        {activeStep && (
          <div className="space-y-1 my-auto">
            <h4 className="font-l2 text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
              "{activeStep.instruction}"
            </h4>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm truncate">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">Landmark: {activeStep.landmarkHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Compass & Accelerometer Step Counter Display */}
        <div className="flex flex-row items-center justify-around gap-2 pt-1 border-t border-slate-200/80">
          
          {/* Live Compass Wheel */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white border border-blue-200 shadow-inner flex items-center justify-center shrink-0">
            <span className="absolute top-0.5 text-[7px] font-black text-rose-600">N (0°)</span>
            <span className="absolute bottom-0.5 text-[7px] font-black text-slate-400">S (180°)</span>
            <span className="absolute right-0.5 text-[7px] font-black text-slate-400">E</span>
            <span className="absolute left-0.5 text-[7px] font-black text-slate-400">W</span>

            {/* Target Direction Pointer */}
            {activeStep && (
              <div
                className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-500"
                style={{ transform: `rotate(${activeStep.headingDegrees}deg)` }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 border border-white shadow -translate-y-6 animate-ping" />
              </div>
            )}

            {/* Phone Compass Needle */}
            <Compass
              className="w-8 h-8 text-[#1d4ed8] transition-transform duration-300"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />

            <span className="absolute bottom-2 text-[7px] font-extrabold text-slate-700">
              {compassHeading}° N
            </span>
          </div>

          {/* Segment Step Counter (Resets after every node / turn) */}
          <div className="text-center bg-white p-2 rounded-xl border border-slate-200 flex-1">
            <span className="text-[8px] sm:text-[9px] font-extrabold uppercase text-slate-400 block">Node Steps Walked:</span>
            <span className="text-lg sm:text-xl font-black text-[#1d4ed8] block leading-tight">{segmentSteps} steps</span>
            <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 block truncate">
              Target: {activeStep?.stepsCount || 0} steps ({activeStep?.headingText})
            </span>
          </div>
        </div>
      </div>

      {/* 3. STEP NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between gap-2">
        <button
          disabled={currentStepIndex === 0}
          onClick={handlePreviousStep}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-[11px] font-bold text-slate-700 active:scale-95 transition-all"
        >
          Previous
        </button>

        {currentStepIndex < route.steps.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-gradient text-white font-black text-[11px] shadow flex items-center justify-center gap-1 transform active:scale-95 transition-all"
          >
            <span>Reached Node — Next ➔</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow flex items-center justify-center gap-1 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Arrived at Destination!</span>
          </button>
        )}
      </div>
    </div>
  );
};
