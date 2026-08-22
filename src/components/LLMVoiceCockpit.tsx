import React, { useState, useEffect } from 'react';
import { LLMRouteKnowledge, LLMStepInstruction } from '../data/llmRoutesKnowledge';
import { Volume2, CheckCircle2, MapPin, ArrowUp, ArrowLeft, ArrowRight, Layers, ArrowUpRight, ArrowDownRight, Footprints } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';

interface LLMVoiceCockpitProps {
  route: LLMRouteKnowledge;
  isNavigating?: boolean;
  onArrived?: () => void;
}

export const LLMVoiceCockpit: React.FC<LLMVoiceCockpitProps> = ({ route, isNavigating = false, onArrived }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [segmentSteps, setSegmentSteps] = useState<number>(0);

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
  }, [route.id]);

  // Reset segment steps when step index changes
  useEffect(() => {
    sensorService.resetStepCounter();
    setSegmentSteps(0);
  }, [currentStepIndex]);

  // Sensor Watcher for Step Counter (Accelerometer)
  useEffect(() => {
    return sensorService.watchStepCounter((steps) => setSegmentSteps(steps));
  }, []);

  // Speak active step voice prompt
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

  const targetSteps = activeStep?.stepsCount || 20;
  const stepProgress = Math.min(100, Math.round((segmentSteps / targetSteps) * 100));

  return (
    <div className="w-full flex-1 flex flex-col justify-between rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-md bg-white/95 backdrop-blur-md font-l3 space-y-3 overflow-hidden">
      
      {/* HEADER NODE INSTRUCTION & READ ALOUD BUTTON */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
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

        {/* Instruction */}
        {activeStep && (
          <div className="space-y-1.5">
            <h4 className="font-l2 text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-2">
              "{activeStep.instruction}"
            </h4>

            {activeStep.landmarkHint && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 shadow-sm truncate">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Landmark: {activeStep.landmarkHint}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROMINENT DIRECTION ACTION CARD (NO COMPASS) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-3.5 my-auto">
        
        {/* BIG DIRECTION ACTION CARD */}
        <div className="w-full max-w-sm">
          {actionType === 'left' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-amber-500 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-amber-400">
              <ArrowLeft className="w-10 h-10 animate-pulse" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                TURN LEFT AFTER {targetSteps} STEPS
              </span>
              <span className="text-xs font-semibold text-amber-100">
                Walk {targetSteps} steps forward then turn left
              </span>
            </div>
          )}

          {actionType === 'right' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-amber-500 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-amber-400">
              <ArrowRight className="w-10 h-10 animate-pulse" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                TURN RIGHT AFTER {targetSteps} STEPS
              </span>
              <span className="text-xs font-semibold text-amber-100">
                Walk {targetSteps} steps forward then turn right
              </span>
            </div>
          )}

          {actionType === 'straight' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-blue-600 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-blue-500">
              <ArrowUp className="w-10 h-10 animate-pulse" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                WALK STRAIGHT FOR {targetSteps} STEPS
              </span>
              <span className="text-xs font-semibold text-blue-100">
                Continue walking straight along the hallway
              </span>
            </div>
          )}

          {actionType === 'stair_up' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-indigo-600 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-indigo-500">
              <ArrowUpRight className="w-10 h-10 animate-bounce" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                CLIMB STAIRS UP 🪜
              </span>
              <span className="text-xs font-semibold text-indigo-100">
                Take the staircase up to the next floor
              </span>
            </div>
          )}

          {actionType === 'stair_down' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-purple-600 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-purple-500">
              <ArrowDownRight className="w-10 h-10 animate-bounce" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                GO STAIRS DOWN 🪜
              </span>
              <span className="text-xs font-semibold text-purple-100">
                Take the staircase down to the lower floor
              </span>
            </div>
          )}

          {actionType === 'elevator' && (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-cyan-600 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-2 border-2 border-cyan-500">
              <Layers className="w-10 h-10 animate-pulse" />
              <span className="font-black text-lg sm:text-xl uppercase tracking-wide">
                TAKE ELEVATOR 🛗
              </span>
              <span className="text-xs font-semibold text-cyan-100">
                Enter elevator and select destination floor
              </span>
            </div>
          )}
        </div>

        {/* STEP PROGRESS COUNTER & BAR */}
        <div className="w-full max-w-sm bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-700">
              <Footprints className="w-4 h-4 text-[#1d4ed8]" />
              <span>Step Counter Progress:</span>
            </div>
            <span className="text-xs font-black text-[#1d4ed8]">{segmentSteps} / {targetSteps} steps</span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-300 shadow-sm"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* MANUAL COMPLETION STEP BUTTON */}
      <div className="flex items-center justify-between gap-2.5">
        <button
          disabled={currentStepIndex === 0}
          onClick={handlePreviousStep}
          className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700 active:scale-95 transition-all"
        >
          Previous
        </button>

        {currentStepIndex < route.steps.length - 1 ? (
          <button
            onClick={handleNextStep}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-gradient text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 transform active:scale-95 transition-all"
          >
            <span>Step Completed — Next ➔</span>
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 transform active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Arrived at Destination! 🎉</span>
          </button>
        )}
      </div>
    </div>
  );
};
