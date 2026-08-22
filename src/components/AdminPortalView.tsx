import React, { useState, useEffect } from 'react';
import { Compass, Footprints, Key, Lock, Mic, CheckCircle2, X, Sparkles } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import { speechService } from '../services/speechService';
import { generateLLMRouteWithGemini } from '../services/geminiRouteService';
import { LLM_ROUTES_KNOWLEDGE, LLMRouteKnowledge } from '../data/llmRoutesKnowledge';

interface AdminPortalViewProps {
  onClose: () => void;
  onRouteAdded: (route: LLMRouteKnowledge) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose, onRouteAdded }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Sensors & Admin Feeding State
  const [compassHeading, setCompassHeading] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDescription, setVoiceDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sensors Watcher
  useEffect(() => {
    if (isAuthenticated) {
      sensorService.requestSensorsPermission().then((granted) => {
        if (granted) {
          sensorService.watchOrientation((heading) => setCompassHeading(heading));
          sensorService.watchStepCounter((steps) => setStepCount(steps));
        }
      });
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'admin' || password === '1234') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Password. Please try "admin123"');
    }
  };

  const handleToggleVoiceRecord = () => {
    if (isRecordingVoice) {
      speechService.stopListening();
      setIsRecordingVoice(false);
      return;
    }

    setIsRecordingVoice(true);
    speechService.startListening(
      (text, _isFinal) => {
        setVoiceDescription(text);
      },
      (_err) => {
        setIsRecordingVoice(false);
      },
      () => {
        setIsRecordingVoice(false);
      }
    );
  };

  const handleGenerateAndSaveRoute = async () => {
    if (!voiceDescription.trim()) {
      alert('Please speak or type a natural language route description first.');
      return;
    }

    setIsGenerating(true);
    setSuccessMessage('');

    try {
      const newRoute = await generateLLMRouteWithGemini(
        voiceDescription,
        compassHeading,
        stepCount
      );

      if (newRoute) {
        LLM_ROUTES_KNOWLEDGE.unshift(newRoute);
        onRouteAdded(newRoute);
        setSuccessMessage(`Successfully generated & saved route for "${newRoute.destinationName}"!`);
        setVoiceDescription('');
      }
    } catch (err) {
      console.error('Failed to generate route:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-l3">
        <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold font-l2">
              <div className="p-2 rounded-xl bg-blue-50 text-[#1d4ed8]">
                <Lock className="w-5 h-5" />
              </div>
              <span>Admin Portal Login</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Enter Admin Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password (e.g. admin123)"
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
              />
              {authError && <p className="text-[11px] font-bold text-rose-600 mt-1">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#1d4ed8] text-white font-extrabold text-xs shadow-md"
            >
              Authenticate & Unlock Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-l3">
      <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-3.5 max-h-[85dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-l2 text-base font-bold text-slate-900">Admin Data Feeding Panel</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Live Sensors + Gemini AI LLM Route Generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Admin Sensors Dashboard */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Live Compass Heading</span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Compass className="w-4 h-4 text-[#1d4ed8]" style={{ transform: `rotate(${compassHeading}deg)` }} />
              <span className="text-xs font-extrabold text-slate-900">{compassHeading}° N</span>
            </div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Steps Walked</span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Footprints className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-700">{stepCount} Steps</span>
            </div>
          </div>
        </div>

        {/* Natural Language Voice Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Speak or Type Route Directions:
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="e.g. 'From main entrance lobby, walk 30 steps north down corridor, turn east at notice board and walk 15 steps to ground floor washroom'"
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
            />
            <button
              onClick={handleToggleVoiceRecord}
              className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
              }`}
              title="Record Voice Directions"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gemini AI Generate Action Button */}
        <button
          disabled={isGenerating}
          onClick={handleGenerateAndSaveRoute}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{isGenerating ? 'Gemini AI Parsing Route...' : 'Generate & Add Route via Gemini AI'}</span>
        </button>

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Current Database Knowledge Count */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Active LLM Routes in Database:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-200">
            {LLM_ROUTES_KNOWLEDGE.length} Routes
          </span>
        </div>
      </div>
    </div>
  );
};
