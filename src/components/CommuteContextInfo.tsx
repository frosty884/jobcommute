import React from "react";
import { Info, MapPin, Compass, Train, Footprints, ShieldCheck } from "lucide-react";

export const CommuteContextInfo: React.FC = () => {
  return (
    <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-5 md:p-6 text-xs text-slate-600">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          Commute Intelligence: 8558 W Catalpa Ave Transit Hub
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-amber-600" />
            Walk to Cumberland Blue Line
          </p>
          <p className="text-[11px] leading-relaxed">
            Located just <strong>0.4 miles (7–8 minute walk)</strong> from the Cumberland CTA station & bus terminal, allowing immediate rapid rail boarding without relying on feeder vehicles.
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-blue-600" />
            Direct CTA & Pace Corridors
          </p>
          <p className="text-[11px] leading-relaxed">
            Blue Line provides <strong>one-seat rides</strong> west to O'Hare (11m) & Rosemont (5m), and east to Logan Square (18m), Fulton Market (35m), The Loop (38m), and Rush/UIC (45m).
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            1-Hour Mixed-Mode Criteria
          </p>
          <p className="text-[11px] leading-relaxed">
            Calculates door-to-door transit itineraries: pedestrian walking legs, train/bus running times, scheduled headways, and transfer buffers against the <strong>strict 60-minute ceiling</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
