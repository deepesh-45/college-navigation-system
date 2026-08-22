import React, { useState, useEffect } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Volume2, CheckCircle2, MapPin, Navigation } from 'lucide-react';
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

  // Calculate target turn angle relative to phone's current heading
  const relativeTargetAngle = activeStep ? (activeStep.headingDegrees - compassHeading + 360) % 360 : 0;
  
  // Calculate needle counter-rotation angle so Red North pointer ALWAYS points to true North
  const needleRotationAngle = (360 - compassHeading) % 360;

  return (
    <div className="w-full flex-1 flex flex-col justify-between rounded-2xl p-2.5 sm:p-3.5 border border-slate-200 shadow-md bg-white/95 backdrop-blur-md font-l3 space-y-2.5 overflow-hidden">
      
      {/* ACTIVE NODE INSTRUCTION & READ ALOUD BUTTON */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
            Node {currentStepIndex + 1} of {route.steps.length}
          </span>
          <button
            onClick={handleSpeakCurrentStep}
            className="p-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Read Aloud
          </button>
        </div>

        {/* Node Instruction */}
        {activeStep && (
          <div className="space-y-1">
            <h4 className="font-l2 text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
              "{activeStep.instruction}"
            </h4>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Landmark: {activeStep.landmarkHint}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CENTERED LARGE 360° COMPASS & STEP COUNTER */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 my-auto">
        
        {/* CENTERED COMPASS DIAL */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white border-4 border-blue-100 shadow-xl flex items-center justify-center shrink-0">
          
          {/* Cardinal Markers on Phone Viewport */}
          <span className="absolute top-1 text-[10px] font-black text-rose-600">N (0°)</span>
          <span className="absolute bottom-1 text-[10px] font-black text-slate-400">S (180°)</span>
          <span className="absolute right-1.5 text-[10px] font-black text-slate-400">E (90°)</span>
          <span className="absolute left-1.5 text-[10px] font-black text-slate-400">W (270°)</span>

          {/* TARGET DIRECTION GREEN BEACON (Relative to current phone direction) */}
          {activeStep && (
            <div
              className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-500 z-10"
              style={{ transform: `rotate(${relativeTargetAngle}deg)` }}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg -translate-y-14 sm:-translate-y-18 animate-ping" />
            </div>
          )}

          {/* ACCURATE COMPASS NEEDLE (Counter-rotates so Red North 🔴 ALWAYS points to physical North) */}
          <div
            className="relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300 z-20"
            style={{ transform: `rotate(${needleRotationAngle}deg)` }}
          >
            {/* North Red Pointer 🔴 (Points directly to Physical North) */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[48px] sm:border-b-[58px] border-b-rose-600 drop-shadow flex items-center justify-center">
              <span className="text-[9px] font-black text-white -translate-y-5">N</span>
            </div>

            {/* Center Pivot Ring */}
            <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-md z-30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </div>

            {/* South Slate Pointer ⚪ */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[48px] sm:border-t-[58px] border-t-slate-400 drop-shadow opacity-75 flex items-center justify-center">
              <span className="text-[9px] font-black text-white translate-y-5">S</span>
            </div>
          </div>

          {/* Live Phone Heading Angle Badge */}
          <div className="absolute bottom-2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-extrabold text-[9px] shadow z-30">
            {compassHeading}° N
          </div>
        </div>

        {/* SEGMENT ACCELEROMETER STEP COUNTER */}
        <div className="w-full text-center bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-sm max-w-xs">
          <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-500">
            <Navigation className="w-3 h-3 text-[#1d4ed8]" />
            <span>Steps Walked for Node:</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#1d4ed8] block leading-tight">{segmentSteps} steps</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 block truncate">
            Target: {activeStep?.stepsCount || 0} steps ({activeStep?.headingText})
          </span>
        </div>
      </div>

      {/* STEP NAVIGATION CONTROLS */}
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
            className="flex-1 py-2.5 px-3 rounded-xl bg-brand-gradient text-white font-black text-[11px] shadow flex items-center justify-center gap-1 transform active:scale-95 transition-all"
          >
            <span>Reached Node — Next ➔</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow flex items-center justify-center gap-1 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Arrived at Destination!</span>
          </button>
        )}
      </div>
    </div>
  );
};
