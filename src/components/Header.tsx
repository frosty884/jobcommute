import React from "react";
import { Train, Navigation, CheckCircle2, Clock } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Chicago Transit Commute Verifier
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                1-Hr Limit
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Navigation className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Origin:</span>
              <strong className="text-slate-700 font-semibold">8558 W Catalpa, Chicago, IL</strong>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Cumberland Blue Line corridor</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Mode: <strong>Transit + Walking</strong></span>
          <span className="text-slate-300">|</span>
          <span>Target: <strong>≤ 60 mins</strong></span>
        </div>
      </div>
    </header>
  );
};
