import React, { useState, useEffect, useRef } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Volume2, CheckCircle2, MapPin, Navigation, ArrowUp, ArrowLeft, ArrowRight, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  const [turnDetectedBanner, setTurnDetectedBanner] = useState<string | null>(null);

  const initialHeadingRef = useRef<number | null>(null);
  const activeStep: LLMStepInstruction | undefined = route.steps[currentStepIndex];

  // Determine Direction Action Type from active step
  const getActionType = (step?: LLMStepInstruction) => {
    if (!step) return 'straight';
    const act = (step.action || '').toLowerCase();
    const inst = (step.instruction || '').toLowerCase();

    if (act.includes('left') || inst.includes('turn left') || inst.includes('left')) return 'left';
    if (act.includes('right') || inst.includes('turn right') || inst.includes('right')) return 'right';
    if (act.includes('stair_up') || inst.includes('staircase up') || inst.includes('climb stairs') || inst.includes('stairs up') || inst.includes('go up')) return 'stair_up';
    if (act.includes('stair_down') || inst.includes('staircase down') || inst.includes('descend stairs') || inst.includes('stairs down') || inst.includes('go down')) return 'stair_down';
    if (act.includes('elevator') || inst.includes('elevator') || inst.includes('lift')) return 'elevator';
    return 'straight';
  };

  const actionType = getActionType(activeStep);

  // Reset step index & accelerometer when route changes
  useEffect(() => {
    setCurrentStepIndex(0);
    sensorService.resetStepCounter();
    setSegmentSteps(0);
    initialHeadingRef.current = null;
  }, [route.id]);

  // Reset segment steps & capture initial heading when step index changes
  useEffect(() => {
    sensorService.resetStepCounter();
    setSegmentSteps(0);
    initialHeadingRef.current = null;
  }, [currentStepIndex]);

  // Sensor Watcher for Compass & Step Counter
  useEffect(() => {
    return sensorService.watchOrientation((heading) => {
      setCompassHeading(heading);

      if (initialHeadingRef.current === null) {
        initialHeadingRef.current = heading;
      } else {
        // Automatic Relative Turn Deviation Detection (60° turn deviation threshold)
        const deviation = Math.abs((heading - initialHeadingRef.current + 540) % 360 - 180);
        if (deviation >= 50 && (actionType === 'left' || actionType === 'right')) {
          initialHeadingRef.current = heading; // lock new heading
          sensorService.triggerHapticFeedback([100, 50, 100]);
          setTurnDetectedBanner(`Turn Detected! (${Math.round(deviation)}°)`);
          setTimeout(() => setTurnDetectedBanner(null), 2500);
        }
      }
    });
  }, [actionType]);

  useEffect(() => {
    return sensorService.watchStepCounter((steps) => setSegmentSteps(steps));
  }, []);

  // Automatic Altitude & Floor Change Detection at Staircase/Elevator Nodes
  useEffect(() => {
    const stopAltitudeWatcher = sensorService.watchAltitudeFloorChange((direction) => {
      if (actionType === 'stair_up' || actionType === 'stair_down' || actionType === 'elevator') {
        sensorService.triggerHapticFeedback([120, 60, 120]);
        speechService.speak(`Floor altitude change detected ${direction}. Advancing to next step.`);
        setTurnDetectedBanner(`Stairs ${direction.toUpperCase()} Motion Detected!`);
        setTimeout(() => setTurnDetectedBanner(null), 2500);
        handleNextStep();
      }
    });

    return () => stopAltitudeWatcher();
  }, [currentStepIndex, actionType]);

  // Speak active node step voice prompt
  useEffect(() => {
    if (isNavigating && activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  }, [currentStepIndex, activeStep, isNavigating]);

  const handleSpeakCurrentStep = () => {
    if (activeStep) {
      speechService.speak(`Step ${activeStep.stepNumber}: ${activeStep.voicePrompt}`);
    }
  };

  const handleNextStep = () => {
    sensorService.triggerHapticFeedback([60]);
    sensorService.resetStepCounter();
    setSegmentSteps(0);
    initialHeadingRef.current = null;

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
    initialHeadingRef.current = null;
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const dialRotationAngle = (360 - compassHeading) % 360;

  return (
    <div className="w-full flex-1 flex flex-col justify-between rounded-2xl p-2.5 sm:p-3.5 border border-slate-200 shadow-md bg-white/95 backdrop-blur-md font-l3 space-y-2.5 overflow-hidden">
      
      {/* ACTIVE NODE INSTRUCTION & READ ALOUD BUTTON */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
            Step {currentStepIndex + 1} of {route.steps.length}
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

      {/* PROMINENT DIRECTION ACTION BADGE & RELATIVE COMPASS */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-2.5 my-auto">
        
        {/* AUTOMATIC TURN DETECTED SENSOR BANNER */}
        {turnDetectedBanner && (
          <div className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-lg animate-bounce flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{turnDetectedBanner}</span>
          </div>
        )}

        {/* BIG DIRECTION ACTION BADGE */}
        <div className="w-full max-w-xs flex items-center justify-center">
          {actionType === 'left' && (
            <div className="w-full p-2.5 rounded-xl bg-amber-500 text-white shadow-md flex items-center justify-center gap-2">
              <ArrowLeft className="w-6 h-6 animate-pulse" />
              <span className="font-black text-sm uppercase tracking-wide">TURN LEFT</span>
            </div>
          )}

          {actionType === 'right' && (
            <div className="w-full p-2.5 rounded-xl bg-amber-500 text-white shadow-md flex items-center justify-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">TURN RIGHT</span>
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>
          )}

          {actionType === 'straight' && (
            <div className="w-full p-2.5 rounded-xl bg-blue-600 text-white shadow-md flex items-center justify-center gap-2">
              <ArrowUp className="w-6 h-6 animate-pulse" />
              <span className="font-black text-sm uppercase tracking-wide">WALK STRAIGHT</span>
            </div>
          )}

          {actionType === 'stair_up' && (
            <div className="w-full p-2.5 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center gap-2">
              <ArrowUpRight className="w-6 h-6 animate-bounce" />
              <span className="font-black text-sm uppercase tracking-wide">CLIMB STAIRS UP 🪜</span>
            </div>
          )}

          {actionType === 'stair_down' && (
            <div className="w-full p-2.5 rounded-xl bg-purple-600 text-white shadow-md flex items-center justify-center gap-2">
              <ArrowDownRight className="w-6 h-6 animate-bounce" />
              <span className="font-black text-sm uppercase tracking-wide">GO STAIRS DOWN 🪜</span>
            </div>
          )}

          {actionType === 'elevator' && (
            <div className="w-full p-2.5 rounded-xl bg-cyan-600 text-white shadow-md flex items-center justify-center gap-2">
              <Layers className="w-6 h-6 animate-pulse" />
              <span className="font-black text-sm uppercase tracking-wide">TAKE ELEVATOR 🛗</span>
            </div>
          )}
        </div>

        {/* RELATIVE TURN DEVIATION COMPASS DIAL */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-900 border-4 border-blue-600 shadow-xl flex items-center justify-center shrink-0 p-1">
          
          {/* FIXED TOP HEADING POINTER PIN */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-rose-600 drop-shadow" />
          </div>

          {/* ROTATING COMPASS DIAL WHEEL */}
          <div
            className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/80 relative flex items-center justify-center transition-transform duration-300 pointer-events-none"
            style={{ transform: `rotate(${dialRotationAngle}deg)` }}
          >
            {/* North 0° Marker */}
            <div className="absolute top-1 flex flex-col items-center">
              <span className="text-[10px] font-black text-rose-500">N</span>
            </div>
            {/* East 90° Marker */}
            <div className="absolute right-1.5 flex items-center">
              <span className="text-[9px] font-black text-slate-300">E</span>
            </div>
            {/* South 180° Marker */}
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-300">S</span>
            </div>
            {/* West 270° Marker */}
            <div className="absolute left-1.5 flex items-center">
              <span className="text-[9px] font-black text-slate-300">W</span>
            </div>
          </div>

          {/* CENTER STEP HEADING BADGE */}
          <div className="absolute w-11 h-11 rounded-full bg-slate-950 border-2 border-blue-500 shadow-md flex flex-col items-center justify-center text-white z-20 pointer-events-none">
            <span className="text-[10px] font-black text-emerald-400 leading-none">{compassHeading}°</span>
            <span className="text-[6.5px] font-extrabold text-slate-400 uppercase tracking-tighter mt-0.5">Turn Dev</span>
          </div>
        </div>

        {/* ACCELEROMETER STEP COUNTER */}
        <div className="w-full text-center bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-sm max-w-xs">
          <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-500">
            <Navigation className="w-3 h-3 text-[#1d4ed8]" />
            <span>Steps Walked:</span>
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
