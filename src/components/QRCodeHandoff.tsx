import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, ArrowRight, X } from 'lucide-react';
import { RouteResult } from '../types';

interface QRCodeHandoffProps {
  route: RouteResult;
  onClose: () => void;
}

export const QRCodeHandoff: React.FC<QRCodeHandoffProps> = ({ route, onClose }) => {
  const destName = 'name' in route.destination ? route.destination.name : 'Target Destination';
  
  // Create mobile handoff URL
  const mobileUrl = `${window.location.origin}/mobile?dest=${encodeURIComponent(destName)}&dist=${route.totalDistance}&time=${route.estimatedMinutes}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-3">
            <QrCode className="w-8 h-8" />
          </div>
          {/* LEVEL 1 FONT */}
          <h2 className="font-l1 text-2xl font-bold text-slate-900">Scan for Mobile Navigation</h2>
          {/* LEVEL 2 FONT */}
          <p className="font-l2 text-sm text-slate-600 mt-1 font-medium">Take this route live on your phone</p>
        </div>

        {/* High-Contrast QR Code Wrapper */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
          <QRCodeSVG
            value={mobileUrl}
            size={200}
            bgColor="#f8fafc"
            fgColor="#0f172a"
            level="H"
            includeMargin={true}
          />
          {/* LEVEL 3 FONT */}
          <div className="font-l3 mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Smartphone className="w-4 h-4 text-blue-600" />
            No App Install Needed • Instant Web App
          </div>
        </div>

        {/* Route Details Brief */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <div className="font-l3 flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Destination:</span>
            <span className="font-semibold text-emerald-700">Verified Match</span>
          </div>
          {/* LEVEL 2 FONT */}
          <p className="font-l2 text-base font-bold text-slate-900 truncate mb-2">{destName}</p>

          {/* LEVEL 3 FONT */}
          <div className="font-l3 flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <span className="text-slate-600">Total Distance: <strong className="text-blue-700">{route.totalDistance}m</strong></span>
            <span className="text-slate-600">Walking Time: <strong className="text-emerald-700">~{route.estimatedMinutes} mins</strong></span>
          </div>
        </div>

        {/* Action Button */}
        <a
          href={mobileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-l2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98"
        >
          Open Mobile Navigation View
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
