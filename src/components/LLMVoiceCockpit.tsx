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

  // Rotating Dial Angle (-compassHeading so the dial rotates under the fixed top pin)
  const dialRotationAngle = (360 - compassHeading) % 360;

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

      {/* CENTERED ROTATING 360° COMPASS DIAL WITH FIXED TOP POINTER PIN */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 my-auto">
        
        {/* COMPASS CONTAINER */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-900 border-4 border-blue-600 shadow-2xl flex items-center justify-center shrink-0 p-1">
          
          {/* FIXED TOP HEADING POINTER PIN (Always points down at current degree under 12 o'clock) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-rose-600 drop-shadow-md" />
          </div>

          {/* ROTATING COMPASS DIAL WHEEL (Rotates by -compassHeading) */}
          <div
            className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/80 relative flex items-center justify-center transition-transform duration-300 pointer-events-none"
            style={{ transform: `rotate(${dialRotationAngle}deg)` }}
          >
            {/* North 0° Marker in Bright Red */}
            <div className="absolute top-1 flex flex-col items-center">
              <span className="text-[11px] font-black text-rose-500 tracking-wider">N</span>
              <span className="text-[7px] font-extrabold text-rose-400">0°</span>
            </div>

            {/* East 90° Marker */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              <span className="text-[10px] font-black text-slate-300">E</span>
              <span className="text-[7px] font-bold text-slate-400">90°</span>
            </div>

            {/* South 180° Marker */}
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-[7px] font-bold text-slate-400">180°</span>
              <span className="text-[10px] font-black text-slate-300">S</span>
            </div>

            {/* West 270° Marker */}
            <div className="absolute left-1.5 flex items-center gap-0.5">
              <span className="text-[7px] font-bold text-slate-400">270°</span>
              <span className="text-[10px] font-black text-slate-300">W</span>
            </div>

            {/* TARGET TURN DIRECTION BEACON (Positioned on the rotating compass dial) */}
            {activeStep && (
              <div
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-500 z-10"
                style={{ transform: `rotate(${activeStep.headingDegrees}deg)` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-lg -translate-y-13 sm:-translate-y-16 animate-ping" />
              </div>
            )}
          </div>

          {/* CENTER HEADING BADGE */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-950 border-2 border-blue-500 shadow-md flex flex-col items-center justify-center text-white z-20 pointer-events-none">
            <span className="text-[11px] font-black text-emerald-400 leading-none">{compassHeading}°</span>
            <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-tighter mt-0.5">Heading</span>
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
