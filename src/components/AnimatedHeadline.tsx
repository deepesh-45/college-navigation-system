import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedHeadlineProps {
  text: string;
  subtext?: string;
  voiceState: 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error';
}

export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({ text, subtext, voiceState }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-4xl px-4 py-2">
      {/* LEVEL 3 FONT: Voice Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-200 bg-blue-50/80 text-blue-800 text-xs font-semibold tracking-wider uppercase shadow-sm font-l3"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${
          voiceState === 'listening' ? 'bg-rose-500 animate-ping' :
          voiceState === 'processing' ? 'bg-amber-500 animate-pulse' :
          voiceState === 'speaking' ? 'bg-emerald-500 animate-bounce' :
          voiceState === 'success' ? 'bg-emerald-600' : 'bg-blue-600 animate-pulse'
        }`} />
        {voiceState === 'idle' && 'AI Voice Assistant Ready'}
        {voiceState === 'listening' && 'Listening to your voice...'}
        {voiceState === 'processing' && 'Understanding Campus Location...'}
        {voiceState === 'speaking' && 'Speaking Directions...'}
        {voiceState === 'success' && 'Destination Resolved'}
        {voiceState === 'error' && 'Location Not Found'}
      </motion.div>

      {/* MASTER PALETTE HEADLINE (Space Grotesk / Patua One - 6xl / 7xl) */}
      <div className="min-h-[140px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.h1
            key={text}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="font-patua text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
          >
            {voiceState === 'listening' ? (
              <span className="text-gradient-hello">"Where would you like to go?"</span>
            ) : voiceState === 'success' ? (
              <span className="text-gradient-namaskaram">{text}</span>
            ) : (
              text
            )}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* LEVEL 2 FONT: Subtext Description (Outfit - 2xl) */}
      {subtext && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-l2 mt-3 text-lg md:text-2xl text-slate-600 font-medium max-w-2xl leading-relaxed"
        >
          {subtext}
        </motion.p>
      )}
    </div>
  );
};
