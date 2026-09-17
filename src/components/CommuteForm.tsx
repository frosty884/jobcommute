import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Briefcase, Building2, Clock, Sparkles, X, Loader2 } from "lucide-react";

interface CommuteFormProps {
  onCheckCommute: (data: { destination: string; jobTitle?: string; companyName?: string; departureMode: string }) => void;
  isLoading: boolean;
}

const PRESET_JOBS = [
  { label: "The Loop (Clark/Lake)", address: "100 W Randolph St, Chicago, IL 60601", badge: "CBD" },
  { label: "O'Hare Int'l Airport", address: "O'Hare International Airport, Chicago, IL 60666", badge: "Airport" },
  { label: "Fulton Market / West Loop", address: "1000 W Fulton Market, Chicago, IL 60607", badge: "Tech Hub" },
  { label: "Rush Medical District", address: "1653 W Congress Pkwy, Chicago, IL 60612", badge: "Healthcare" },
  { label: "Merchandise Mart / River North", address: "222 W Merchandise Mart Plaza, Chicago, IL 60654", badge: "River North" },
  { label: "Schaumburg Office Center", address: "1400 E Golf Rd, Schaumburg, IL 60173", badge: "NW Suburb" },
  { label: "Evanston Downtown", address: "1603 Orrington Ave, Evanston, IL 60201", badge: "North Shore" },
];

export const CommuteForm: React.FC<CommuteFormProps> = ({ onCheckCommute, isLoading }) => {
  const [address, setAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [departureMode, setDepartureMode] = useState("rush_morning");
  const [suggestions, setSuggestions] = useState<Array<{ description: string; mainText: string; secondaryText: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete fetch (works on GitHub Pages and local)
  useEffect(() => {
    if (!address.trim() || address.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);

        // 1. Try Google Maps JS client-side AutocompleteService if available
        if (window.google?.maps?.places?.AutocompleteService) {
          try {
            const service = new window.google.maps.places.AutocompleteService();
            service.getPlacePredictions(
              {
                input: address.trim(),
                componentRestrictions: { country: "us" },
                locationBias: {
                  radius: 50000,
                  center: { lat: 41.9804, lng: -87.8407 }, // Catalpa origin
                },
              },
              (predictions: any, status: any) => {
                if (status === "OK" && predictions && predictions.length > 0) {
                  setSuggestions(
                    predictions.map((p: any) => ({
                      description: p.description,
                      mainText: p.structured_formatting?.main_text || p.description,
                      secondaryText: p.structured_formatting?.secondary_text || "",
                    }))
                  );
                  setIsFetchingSuggestions(false);
                  return;
                }
                fallbackLocalSuggestions(address.trim());
              }
            );
            return;
          } catch (e) {
            console.warn("Client places service failed:", e);
          }
        }

        // 2. Try server endpoint if available
        try {
          const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(address.trim())}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.predictions && data.predictions.length > 0) {
                setSuggestions(data.predictions);
                setIsFetchingSuggestions(false);
                return;
              }
            }
          }
        } catch {
          // Server not present (e.g. GitHub Pages)
        }

        // 3. Fallback local Chicagoland directory
        fallbackLocalSuggestions(address.trim());
      } catch (err) {
        console.warn("Autocomplete fetch failed", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [address]);

  const fallbackLocalSuggestions = (query: string) => {
    const chicagoHubs = [
      "100 S Wacker Dr, Chicago, IL 60606",
      "111 W Jackson Blvd, Chicago, IL 60604",
      "100 W Randolph St, Chicago, IL 60601",
      "Merchandise Mart, 222 W Merchandise Mart Plaza, Chicago, IL 60654",
      "O'Hare International Airport, Chicago, IL 60666",
      "1000 W Fulton Market, Chicago, IL 60607",
      "Rush University Medical Center, 1653 W Congress Pkwy, Chicago, IL",
      "Rosemont Theatre, 5400 N River Rd, Rosemont, IL 60018",
      "Woodfield Mall, Schaumburg, IL 60173",
      "Northwestern University, Evanston, IL 60208",
      "Willis Tower, 233 S Wacker Dr, Chicago, IL 60606",
      "Navy Pier, 600 E Grand Ave, Chicago, IL 60611",
      "UIC East Campus, 1200 W Harrison St, Chicago, IL 60607",
      "Oakbrook Center, 100 Oakbrook Center, Oak Brook, IL 60523",
      "Allstate Headquarters, 2775 Sanders Rd, Northbrook, IL 60062",
    ];

    const q = query.toLowerCase();
    const matches = chicagoHubs
      .filter((h) => h.toLowerCase().includes(q))
      .map((h) => ({
        description: h,
        mainText: h.split(",")[0],
        secondaryText: h.split(",").slice(1).join(",").trim(),
      }));

    setSuggestions(matches);
  };

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setShowDropdown(false);
    onCheckCommute({
      destination: address.trim(),
      jobTitle: jobTitle.trim() || undefined,
      companyName: companyName.trim() || undefined,
      departureMode,
    });
  };

  const selectPreset = (presetAddress: string, presetLabel: string) => {
    setAddress(presetAddress);
    setCompanyName(presetLabel);
    setShowDropdown(false);
    onCheckCommute({
      destination: presetAddress,
      companyName: presetLabel,
      departureMode,
    });
  };

  const selectSuggestion = (desc: string) => {
    setAddress(desc);
    setShowDropdown(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address input with autocomplete */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Target Job Address or Work Location
            </span>
            <span className="text-xs font-normal text-slate-500">
              Cross-referenced from 8558 W Catalpa
            </span>
          </label>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="e.g. 100 S Wacker Dr, Chicago or O'Hare Cargo Bldg..."
              className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:bg-white rounded-xl text-slate-900 text-sm placeholder-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <div className="absolute left-3.5 text-slate-400">
              {isFetchingSuggestions ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            <div className="absolute right-2.5 flex items-center gap-1">
              {address && (
                <button
                  type="button"
                  onClick={() => {
                    setAddress("");
                    setSuggestions([]);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Matching Chicago Addresses
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(item.description)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 border-b border-slate-50 last:border-0 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed truncate">
                    <p className="font-semibold text-slate-800 truncate">{item.mainText}</p>
                    {item.secondaryText && (
                      <p className="text-slate-500 text-[11px] truncate">{item.secondaryText}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional Metadata Row (Job Title & Company & Departure Time) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Job Title (Optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. UX Designer / Nurse"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Company / Employer (Optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. United Airlines / Rush"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Commute Timing
            </label>
            <select
              value={departureMode}
              onChange={(e) => setDepartureMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
            >
              <option value="rush_morning">Morning Rush (8:00 AM Weekday)</option>
              <option value="rush_evening">Evening Rush (5:00 PM Weekday)</option>
              <option value="now">Depart Now (Current Schedule)</option>
            </select>
          </div>
        </div>

        {/* Action Button & Preset Fast-Pick Chips */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Sample Jobs:
            </span>
            {PRESET_JOBS.slice(0, 4).map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectPreset(p.address, p.label)}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 transition-colors"
              >
                {p.label.split("(")[0].trim()}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cross-Referencing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Check 1-Hr Commute
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
