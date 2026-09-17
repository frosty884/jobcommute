import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Train, Layers, Maximize2, RotateCcw } from "lucide-react";
import { CommuteResult } from "../types";
import { decodePolyline } from "../utils/polyline";

interface MapViewProps {
  result: CommuteResult | null;
  apiKey: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMap?: () => void;
  }
}

export const MapView: React.FC<MapViewProps> = ({ result, apiKey }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const googleMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Load Google Maps SDK
  useEffect(() => {
    if (!apiKey) {
      setMapError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, [apiKey]);

  // Initialize or update Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    try {
      if (!googleMapInstanceRef.current) {
        googleMapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: 41.9804, lng: -87.8407 }, // 8558 W Catalpa
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "transit.line",
              elementType: "geometry",
              stylers: [{ color: "#00A1DE" }, { weight: 2.5 }],
            },
          ],
        });
      }

      const map = googleMapInstanceRef.current;

      // Clear previous markers & polylines
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      const origin = result?.originCoords || { lat: 41.9804, lng: -87.8407 };

      // Origin Marker (Home: 8558 W Catalpa)
      const homeMarker = new window.google.maps.Marker({
        position: origin,
        map,
        title: "Home: 8558 W Catalpa, Chicago, IL",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#2563EB",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2.5,
        },
      });
      markersRef.current.push(homeMarker);

      // Cumberland CTA Station marker for context
      const stationMarker = new window.google.maps.Marker({
        position: { lat: 41.9842, lng: -87.8403 },
        map,
        title: "Cumberland CTA Station (Blue Line)",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#00A1DE",
          fillOpacity: 0.9,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5,
        },
      });
      markersRef.current.push(stationMarker);

      if (result?.destinationCoords && (result.destinationCoords.lat !== 0 || result.destinationCoords.lng !== 0)) {
        const dest = result.destinationCoords;

        // Destination Marker (Job location)
        const jobMarker = new window.google.maps.Marker({
          position: dest,
          map,
          title: `Job Location: ${result.destinationAddress}`,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: result.within1Hour ? "#059669" : "#E11D48",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        });
        markersRef.current.push(jobMarker);

        // Draw Route Polyline if available
        if (result.overviewPolyline) {
          const pathPoints = decodePolyline(result.overviewPolyline);
          polylineRef.current = new window.google.maps.Polyline({
            path: pathPoints,
            geodesic: true,
            strokeColor: result.within1Hour ? "#059669" : "#E11D48",
            strokeOpacity: 0.85,
            strokeWeight: 4.5,
            map,
          });
        }

        // Fit map bounds to encompass both points
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(dest);
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      } else {
        map.setCenter(origin);
        map.setZoom(13);
      }
    } catch (err) {
      console.warn("Google Maps init error:", err);
      setMapError(true);
    }
  }, [mapLoaded, result]);

  const handleResetView = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: 41.9804, lng: -87.8407 });
      googleMapInstanceRef.current.setZoom(12);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full min-h-[420px]">
      {/* Map Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Commute Route & Chicagoland Transit Grid
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors text-xs flex items-center gap-1"
            title="Reset Map to Catalpa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Center Origin</span>
          </button>
        </div>
      </div>

      {/* Map Canvas / Fallback container */}
      <div className="relative flex-1 w-full min-h-[360px] bg-slate-100">
        {/* Real Google Map element */}
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[360px]"
          style={{ display: mapError ? "none" : "block" }}
        />

        {/* Resilient Fallback SVG Map when Maps API JS is unavailable */}
        {mapError && (
          <div className="w-full h-full min-h-[360px] p-6 flex flex-col items-center justify-center text-center bg-radial from-slate-50 to-slate-100">
            <div className="max-w-md w-full p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-2 border-b border-slate-100">
                <span>Schematic Transit Corridor</span>
                <span className="text-blue-600 font-bold">8558 W Catalpa Anchor</span>
              </div>

              {/* Schematic SVG */}
              <div className="relative h-44 w-full bg-slate-900 rounded-lg p-3 overflow-hidden flex flex-col justify-between text-white">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>O'HARE BRANCH (WEST)</span>
                  <span className="text-blue-400 font-bold">CTA BLUE LINE 'L'</span>
                  <span>LOOP / DOWNTOWN (EAST)</span>
                </div>

                <div className="relative my-auto flex items-center justify-between px-2">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-300 mt-1">O'Hare</span>
                    <span className="text-[9px] text-slate-400">~15m</span>
                  </div>

                  <div className="h-0.5 flex-1 bg-blue-500 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                      <span className="text-[10px] font-bold text-white mt-1">Catalpa / Cumberland</span>
                      <span className="text-[9px] text-emerald-300">Origin (8558 W Catalpa)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300 mt-1">Clark/Lake (Loop)</span>
                    <span className="text-[9px] text-slate-400">~45m</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center">
                  Destination: {result ? result.destinationAddress : "Enter job address above"}
                </div>
              </div>

              <div className="text-left text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  {result
                    ? `Commute: ${result.totalMinutes} mins (${result.within1Hour ? "Within 1 Hour" : "Over 1 Hour"})`
                    : "Enter any Chicago area address to see transit timing"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Origin connects via 8-min walk to Cumberland Station, feeding directly into the CTA Blue Line and Pace 221/223 bus transit hubs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-[11px] text-slate-700 space-y-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Home (8558 W Catalpa)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Job Address (&le;60 min match)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span>Job Address (&gt;60 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-sky-500 inline-block rounded-xs" />
            <span>CTA Blue Line Rail Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
