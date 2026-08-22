import React from 'react';
import { Bell, Calendar, MapPin, Sparkles, GraduationCap, BookOpen, Coffee, Megaphone, ChevronRight } from 'lucide-react';
import { NOTICES } from '../data/noticesData';
import { Notice } from '../types';

interface BottomNoticeCardsProps {
  onSelectDestination: (destId: string, destName: string) => void;
}

export const BottomNoticeCards: React.FC<BottomNoticeCardsProps> = ({ onSelectDestination }) => {
  // Helper to render standard Lucide icon for each notice card
  const renderStandardIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-emerald-600" />;
      case 'Megaphone':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  // Duplicate notices array to create smooth infinite marquee loop
  const marqueeNotices = [...NOTICES, ...NOTICES];

  return (
    <div className="w-full h-44 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-6 py-4 z-20 shrink-0 shadow-2xl flex items-center overflow-hidden">
      <div className="w-full flex items-center gap-6">
        {/* Left Section Label Badge */}
        <div className="flex flex-col items-start gap-1 shrink-0 pr-4 border-r border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            {/* LEVEL 2 FONT */}
            <span className="font-l2 text-sm font-bold uppercase tracking-wide text-slate-900">
              Campus Notices
            </span>
          </div>
          {/* LEVEL 3 FONT */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-l3 text-[11px] font-bold text-slate-500">Live Ticker</span>
          </div>
        </div>

        {/* Continuous Horizontally Moving Cards Ticker */}
        <div className="flex-1 overflow-hidden relative">
          {/* Left & Right Fade Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Marquee Motion Track */}
          <div className="animate-marquee-horizontal flex items-center gap-4">
            {marqueeNotices.map((notice: Notice, idx: number) => (
              <div
                key={`${notice.id}-${idx}`}
                onClick={() => notice.destinationId && onSelectDestination(notice.destinationId, notice.title)}
                className={`min-w-[340px] max-w-[380px] p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-3.5 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                  notice.urgent
                    ? 'bg-rose-50/90 border-rose-300 hover:border-rose-500'
                    : 'bg-white border-slate-200/90 hover:border-blue-400'
                }`}
              >
                {/* Standard Icon Container */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  notice.category === 'Event' ? 'bg-amber-50 border border-amber-200' :
                  notice.category === 'Academic' ? 'bg-blue-50 border border-blue-200' :
                  'bg-emerald-50 border border-emerald-200'
                }`}>
                  {renderStandardIcon(notice.iconName)}
                </div>

                {/* Card Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`font-l3 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md ${
                      notice.category === 'Event' ? 'bg-amber-100 text-amber-800' :
                      notice.category === 'Academic' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {notice.category}
                    </span>
                    <span className="font-l3 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {notice.date}
                    </span>
                  </div>

                  {/* LEVEL 2 FONT: Card Title */}
                  <h4 className="font-l2 text-sm font-bold text-slate-900 truncate hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h4>

                  {/* LEVEL 3 FONT: Card Summary */}
                  <p className="font-l3 text-xs text-slate-600 mt-1 line-clamp-1 leading-tight">
                    {notice.summary}
                  </p>

                  {notice.location && (
                    <div className="font-l3 text-[11px] font-semibold text-blue-700 flex items-center gap-1 mt-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{notice.location}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
