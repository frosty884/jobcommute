import React, { useState } from "react";
import { Bookmark, Download, Trash2, CheckCircle2, AlertTriangle, ExternalLink, Filter } from "lucide-react";
import { JobHistoryItem } from "../types";

interface JobHistoryProps {
  items: JobHistoryItem[];
  onSelectJob: (item: JobHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export const JobHistory: React.FC<JobHistoryProps> = ({
  items,
  onSelectJob,
  onClearHistory,
  onDeleteItem,
}) => {
  const [filter, setFilter] = useState<"all" | "within" | "exceeds">("all");

  if (items.length === 0) return null;

  const filteredItems = items.filter((item) => {
    if (filter === "within") return item.within1Hour;
    if (filter === "exceeds") return !item.within1Hour;
    return true;
  });

  const withinCount = items.filter((i) => i.within1Hour).length;

  const exportCSV = () => {
    const headers = [
      "Job Title",
      "Company",
      "Address",
      "Total Minutes",
      "Within 1 Hour",
      "Transit Minutes",
      "Walk Minutes",
      "Transfers",
      "Checked Date",
    ];

    const rows = items.map((i) => [
      `"${i.jobTitle || ""}"`,
      `"${i.companyName || ""}"`,
      `"${i.address.replace(/"/g, '""')}"`,
      i.totalMinutes,
      i.within1Hour ? "YES" : "NO",
      i.transitMinutes,
      i.walkMinutes,
      i.transfers ?? 0,
      `"${i.checkedAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chicago_job_commutes_8558_catalpa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Cross-Referenced Job Log
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {items.length} Checked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            <strong>{withinCount}</strong> of <strong>{items.length}</strong> jobs meet your 1-hour mixed transit limit from 8558 W Catalpa.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === "all" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter("within")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === "within" ? "bg-white text-emerald-700 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ≤ 1 Hr ({withinCount})
            </button>
            <button
              onClick={() => setFilter("exceeds")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === "exceeds" ? "bg-white text-rose-700 shadow-2xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              &gt; 1 Hr ({items.length - withinCount})
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            title="Export to CSV spreadsheet"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
            title="Clear all saved jobs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Verdict</th>
              <th className="py-2.5 px-3">Job / Company</th>
              <th className="py-2.5 px-3">Location Address</th>
              <th className="py-2.5 px-3">Commute Time</th>
              <th className="py-2.5 px-3">Transit vs Walk</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                onClick={() => onSelectJob(item)}
              >
                <td className="py-3 px-3 shrink-0">
                  {item.within1Hour ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      &le; 1 Hr
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      &gt; 1 Hr
                    </span>
                  )}
                </td>

                <td className="py-3 px-3 font-medium text-slate-900">
                  <div>
                    <span className="font-semibold">{item.jobTitle || "Job Opening"}</span>
                    {item.companyName && (
                      <span className="text-slate-500 block text-[11px] font-normal">
                        {item.companyName}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                  {item.address}
                </td>

                <td className="py-3 px-3 font-bold text-slate-900">
                  <span className={item.within1Hour ? "text-emerald-700" : "text-rose-700"}>
                    {item.totalMinutes} mins
                  </span>
                </td>

                <td className="py-3 px-3 text-slate-500 text-[11px]">
                  <span>{item.transitMinutes}m transit</span>
                  <span className="text-slate-300 mx-1">|</span>
                  <span>{item.walkMinutes}m walk</span>
                </td>

                <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Remove from log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
