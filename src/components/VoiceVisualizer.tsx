import React from 'react';
import { Mic, Volume2, Sparkles } from 'lucide-react';
import { VoiceState } from '../types';

interface VoiceVisualizerProps {
  voiceState: VoiceState;
  onMicClick: () => void;
  transcript: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ voiceState, onMicClick, transcript }) => {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  return (
    <div className="flex flex-col items-center justify-center my-6">
      {/* Central Pulsing Microphone Circle with Master Palette Glows */}
      <div className="relative group flex items-center justify-center">
        {/* Outer Glow Circles */}
        {isListening && (
          <>
            <div className="absolute -inset-8 rounded-full bg-rose-500/30 animate-ping opacity-75" />
            <div className="absolute -inset-14 rounded-full bg-rose-500/20 animate-pulse" />
          </>
        )}
        {isSpeaking && (
          <div className="absolute -inset-10 rounded-full bg-emerald-500/30 animate-pulse" />
        )}
        {isProcessing && (
          <div className="absolute -inset-10 rounded-full bg-amber-500/30 animate-spin" style={{ animationDuration: '3s' }} />
        )}

        {/* Ambient Glow Ring */}
        <div className={`absolute -inset-3 rounded-full blur-xl transition-all duration-500 ${
          isListening ? 'bg-rose-500/40' :
          isSpeaking ? 'bg-emerald-500/40' :
          isProcessing ? 'bg-amber-500/40' : 'bg-blue-600/30 group-hover:bg-purple-600/40'
        }`} />

        {/* Interactive Master Brand Mic Button */}
        <button
          onClick={onMicClick}
          className={`relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform active:scale-95 shadow-xl border ${
            isListening ? 'bg-gradient-to-tr from-rose-600 to-red-500 border-rose-400 text-white scale-105 shadow-rose-500/30' :
            isSpeaking ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white shadow-emerald-500/30' :
            isProcessing ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 border-amber-400 text-white shadow-amber-500/30' :
            'bg-gradient-to-tr from-[#1d4ed8] via-[#4338ca] to-[#6d28d9] border-blue-300/50 text-white hover:scale-105 shadow-indigo-500/30'
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="w-12 h-12 md:w-16 md:h-16 animate-bounce" />
          ) : isListening ? (
            <Mic className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
          ) : isProcessing ? (
            <Sparkles className="w-12 h-12 md:w-16 md:h-16 animate-spin" />
          ) : (
            <Mic className="w-12 h-12 md:w-16 md:h-16" />
          )}

          {/* LEVEL 3 FONT */}
          <span className="font-l3 mt-1 text-[11px] md:text-xs font-bold uppercase tracking-wider opacity-95">
            {isListening ? 'Tap to Stop' : isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Tap to Speak'}
          </span>
        </button>
      </div>

      {/* Audio Waveform Animation Bars */}
      <div className="flex items-center gap-1.5 h-12 mt-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => (
          <div
            key={bar}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isListening ? 'bg-rose-500 animate-pulse' :
              isSpeaking ? 'bg-emerald-500 animate-pulse' :
              isProcessing ? 'bg-amber-500' : 'bg-indigo-400'
            }`}
            style={{
              height: isListening ? `${Math.sin(bar * 0.8) * 20 + 28}px` : isSpeaking ? `${(bar % 3 + 1) * 12}px` : '10px',
              animationDelay: `${bar * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Live Transcript Display Box */}
      {transcript && (
        <div className="mt-4 px-6 py-3 rounded-2xl glass-card-light border border-slate-200/90 max-w-xl text-center shadow-md">
          <p className="font-l3 text-xs uppercase font-semibold tracking-wider text-slate-500 mb-1">You said:</p>
          <p className="font-l2 text-base md:text-lg font-bold text-[#1d4ed8] italic">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};
