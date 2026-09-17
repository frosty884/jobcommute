import React from "react";
import { Footprints, Train, Bus, MapPin, ArrowRight, CornerDownRight } from "lucide-react";
import { TransitStep } from "../types";

interface TransitTimelineProps {
  steps: TransitStep[];
  originAddress: string;
  destinationAddress: string;
}

export const TransitTimeline: React.FC<TransitTimelineProps> = ({
  steps,
  originAddress,
  destinationAddress,
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Train className="w-4 h-4 text-blue-600" />
          Step-by-Step Mixed-Mode Journey
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {steps.length} Route Segments
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Origin node */}
        <div className="relative group">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            A
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-900">Start: 8558 W Catalpa Ave</span>
            <p className="text-slate-500 text-[11px] truncate">{originAddress}</p>
          </div>
        </div>

        {/* Dynamic Route Steps */}
        {steps.map((step, idx) => {
          const isWalking = step.travelMode === "WALKING";
          const transit = step.transitDetails;

          return (
            <div key={idx} className="relative group">
              {/* Step indicator node */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center shadow-xs text-white ${
                  isWalking
                    ? "bg-amber-500"
                    : transit?.color
                    ? ""
                    : "bg-blue-600"
                }`}
                style={!isWalking && transit?.color ? { backgroundColor: transit.color } : {}}
              >
                {isWalking ? (
                  <Footprints className="w-3 h-3" />
                ) : transit?.vehicleType === "BUS" ? (
                  <Bus className="w-3 h-3" />
                ) : (
                  <Train className="w-3 h-3" />
                )}
              </div>

              {/* Step content card */}
              <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {/* Header badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isWalking
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isWalking ? "Walking Leg" : "Transit Leg"}
                      </span>

                      {transit && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-2xs"
                          style={{
                            backgroundColor: transit.color || "#00A1DE",
                            color: transit.textColor || "#FFFFFF",
                          }}
                        >
                          {transit.lineName}
                        </span>
                      )}

                      {transit?.headsign && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          To {transit.headsign}
                        </span>
                      )}
                    </div>

                    {/* Instruction text */}
                    <p className="text-xs font-medium text-slate-800 leading-relaxed pt-0.5">
                      {step.instruction}
                    </p>

                    {/* Transit details (Boarding & Exiting stops) */}
                    {transit && (
                      <div className="pt-2 text-[11px] text-slate-600 space-y-1 border-t border-slate-200/60 mt-2">
                        {transit.departureStop && (
                          <p className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              Board at: <strong className="text-slate-800">{transit.departureStop}</strong>
                            </span>
                          </p>
                        )}
                        {transit.arrivalStop && (
                          <p className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              Exit at: <strong className="text-slate-800">{transit.arrivalStop}</strong>
                              {transit.numStops ? ` (${transit.numStops} stop${transit.numStops > 1 ? "s" : ""})` : ""}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Duration & distance badge */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block">
                      {step.durationText}
                    </span>
                    {step.distanceText && (
                      <span className="text-[11px] text-slate-500">
                        {step.distanceText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Destination node */}
        <div className="relative group">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            B
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-900">Job Destination</span>
            <p className="text-slate-500 text-[11px] truncate">{destinationAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
