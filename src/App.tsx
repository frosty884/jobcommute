import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CommuteForm } from "./components/CommuteForm";
import { VerdictCard } from "./components/VerdictCard";
import { TransitTimeline } from "./components/TransitTimeline";
import { MapView } from "./components/MapView";
import { JobHistory } from "./components/JobHistory";
import { CommuteContextInfo } from "./components/CommuteContextInfo";
import { CommuteResult, JobHistoryItem } from "./types";
import { AlertCircle, Train, CheckCircle2, XCircle } from "lucide-react";

export default function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<CommuteResult | null>(null);
  const [activeJobTitle, setActiveJobTitle] = useState<string>("");
  const [activeCompanyName, setActiveCompanyName] = useState<string>("");
  const [history, setHistory] = useState<JobHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("catalpa_job_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch backend config (API key & origin)
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend config:", err);
      });
  }, []);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("catalpa_job_history", JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to persist history", e);
    }
  }, [history]);

  // Initial demonstration check so user immediately sees live verification in action
  useEffect(() => {
    if (!currentResult) {
      handleCheckCommute({
        destination: "100 W Randolph St, Chicago, IL 60601",
        jobTitle: "Software Engineer",
        companyName: "Loop Tech Center",
        departureMode: "rush_morning",
      });
    }
  }, []);

  const handleCheckCommute = async (data: {
    destination: string;
    jobTitle?: string;
    companyName?: string;
    departureMode: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveJobTitle(data.jobTitle || "");
    setActiveCompanyName(data.companyName || "");

    try {
      const response = await fetch("/api/commute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: data.destination,
          departureMode: data.departureMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Unable to calculate commute for this address.");
      }

      const resultData: CommuteResult = await response.json();
      setCurrentResult(resultData);

      // Auto-add or update in history
      const historyItem: JobHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        address: data.destination,
        totalMinutes: resultData.totalMinutes,
        within1Hour: resultData.within1Hour,
        transfers: resultData.transfers,
        walkMinutes: resultData.walkDurationMinutes,
        transitMinutes: resultData.transitDurationMinutes,
        checkedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
      };

      setHistory((prev) => [historyItem, ...prev.filter((p) => p.address.toLowerCase() !== data.destination.toLowerCase())].slice(0, 50));
    } catch (err: any) {
      console.error("Commute calculation error:", err);
      setErrorMessage(err.message || "Network error. Please verify the address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryJob = (item: JobHistoryItem) => {
    handleCheckCommute({
      destination: item.address,
      jobTitle: item.jobTitle,
      companyName: item.companyName,
      departureMode: "rush_morning",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear your entire job commute history?")) {
      setHistory([]);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">Commute Verification Error</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Address Input Form */}
        <CommuteForm onCheckCommute={handleCheckCommute} isLoading={isLoading} />

        {/* Results Container */}
        {currentResult && (
          <div className="space-y-6">
            {/* Verdict Card (The core 1-hour verification) */}
            <VerdictCard
              result={currentResult}
              jobTitle={activeJobTitle}
              companyName={activeCompanyName}
              onSaveJob={() => {
                alert("Job route saved to your Cross-Referenced Job Log below!");
              }}
              isSaved={history.some((h) => h.address.toLowerCase() === currentResult.destinationAddress.toLowerCase())}
            />

            {/* Split Grid: Step-by-Step Transit Itinerary + Interactive Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-6">
                <TransitTimeline
                  steps={currentResult.transitSteps}
                  originAddress={currentResult.originAddress}
                  destinationAddress={currentResult.destinationAddress}
                />
              </div>

              <div className="lg:col-span-6 sticky top-20">
                <MapView result={currentResult} apiKey={apiKey} />
              </div>
            </div>
          </div>
        )}

        {/* Cross-Referenced Job Log (History of checked job applications) */}
        <JobHistory
          items={history}
          onSelectJob={handleSelectHistoryJob}
          onClearHistory={handleClearHistory}
          onDeleteItem={handleDeleteHistoryItem}
        />

        {/* Commute Intelligence / Catalpa Corridor Details */}
        <CommuteContextInfo />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-700">
            Chicago Transit Commute Verifier &bull; 8558 W Catalpa Ave, Chicago, IL 60656
          </p>
          <p className="text-[11px] text-slate-400">
            Powered by Google Maps Directions & Transit routing for Chicago Transit Authority (CTA) rail & bus, Metra Commuter Rail, and Pace Suburban Bus.
          </p>
        </div>
      </footer>
    </div>
  );
}
