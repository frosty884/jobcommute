import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Footprints, Train, ArrowRight, BookmarkPlus, Share2, Compass, AlertCircle } from "lucide-react";
import { CommuteResult } from "../types";

interface VerdictCardProps {
  result: CommuteResult;
  jobTitle?: string;
  companyName?: string;
  onSaveJob?: () => void;
  isSaved?: boolean;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  result,
  jobTitle,
  companyName,
  onSaveJob,
  isSaved = false,
}) => {
  const {
    within1Hour,
    totalMinutes,
    totalDistanceText,
    walkDurationMinutes,
    transitDurationMinutes,
    transfers = 0,
    departureTimeText,
    arrivalTimeText,
    destinationAddress,
    isEstimateFallback,
    apiWarning,
    walkingOnlyMinutes,
    alternativeOptions,
  } = result;

  const diffMinutes = Math.abs(60 - totalMinutes);

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        within1Hour
          ? "bg-emerald-50/50 border-emerald-300"
          : "bg-rose-50/50 border-rose-300"
      }`}
    >
      {/* Header Banner */}
      <div
        className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          within1Hour
            ? "bg-emerald-100/70 border-emerald-200 text-emerald-950"
            : "bg-rose-100/70 border-rose-200 text-rose-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
              within1Hour ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {within1Hour ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  within1Hour
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-rose-200 text-rose-800"
                }`}
              >
                {within1Hour ? "Verified Match" : "Threshold Exceeded"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Target: ≤ 60 min Mixed Transit
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              {within1Hour ? "Within 1 Hour Commute" : "Exceeds 1 Hour Commute"}
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onSaveJob && (
            <button
              onClick={onSaveJob}
              disabled={isSaved}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isSaved
                  ? "bg-slate-200 text-slate-600 border-slate-300"
                  : "bg-white text-slate-800 hover:bg-slate-50 border-slate-300 shadow-xs"
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              {isSaved ? "Saved in List" : "Save Job Result"}
            </button>
          )}
        </div>
      </div>

      {/* Main Body Metrics */}
      <div className="p-5 md:p-6 space-y-5">
        {/* Job metadata if provided */}
        {(jobTitle || companyName) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 pb-1">
            {jobTitle && <strong className="font-semibold text-slate-900">{jobTitle}</strong>}
            {jobTitle && companyName && <span className="text-slate-400">at</span>}
            {companyName && (
              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-800 border border-slate-200">
                {companyName}
              </span>
            )}
            <span className="text-slate-400 text-xs truncate max-w-md">({destinationAddress})</span>
          </div>
        )}

        {/* Commute Time Big Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Commute
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  within1Hour ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {totalMinutes}
              </span>
              <span className="text-sm font-semibold text-slate-600">mins</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {within1Hour
                ? `${diffMinutes} mins buffer left`
                : `${diffMinutes} mins over 60m cap`}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Train className="w-3 h-3 text-blue-600" /> Transit Ride
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800">
                {transitDurationMinutes}
              </span>
              <span className="text-sm font-semibold text-slate-600">mins</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {transfers === 0 ? "Direct (0 transfers)" : `${transfers} transfer${transfers > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Footprints className="w-3 h-3 text-amber-600" /> Walking Legs
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800">
                {walkDurationMinutes}
              </span>
              <span className="text-sm font-semibold text-slate-600">mins</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">To/from stops</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Compass className="w-3 h-3 text-purple-600" /> Route Distance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-800">
                {totalDistanceText || "N/A"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mixed-mode path</p>
          </div>
        </div>

        {/* Departure & Arrival Schedule details */}
        {(departureTimeText || arrivalTimeText) && (
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                Schedule window: <strong>{departureTimeText || "Depart"}</strong>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span>
                Expected Arrival: <strong>{arrivalTimeText || "Arrival"}</strong>
              </span>
            </div>

            {walkingOnlyMinutes && (
              <span className="text-slate-500 text-[11px]">
                Pure walking alternative: ~{Math.floor(walkingOnlyMinutes / 60)}h {walkingOnlyMinutes % 60}m
              </span>
            )}
          </div>
        )}

        {/* Alternative Routes Pill */}
        {alternativeOptions && alternativeOptions.length > 0 && (
          <div className="pt-1">
            <span className="text-xs font-semibold text-slate-700 block mb-1.5">
              Alternative Transit Routes Available:
            </span>
            <div className="flex flex-wrap gap-2">
              {alternativeOptions.map((alt) => (
                <div
                  key={alt.optionIndex}
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                    alt.within1Hour
                      ? "bg-white border-emerald-200 text-emerald-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="font-semibold">{alt.totalMinutes}m</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600 truncate max-w-xs">{alt.summary}</span>
                  {alt.within1Hour ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">≤60m</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">&gt;60m</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API warning or fallback notice */}
        {isEstimateFallback && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Calculated using Chicago Transit Network model</p>
              <p className="text-amber-700 mt-0.5">
                Commute duration estimated based on the 8558 W Catalpa Cumberland Blue Line station corridor, CTA rail headways, and average walking speeds.
                {apiWarning ? ` Note: ${apiWarning}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
