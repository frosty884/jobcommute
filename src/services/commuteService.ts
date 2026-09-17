import { CommuteResult, TransitStep } from "../types";

export const DEFAULT_MAPS_API_KEY =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || "";

export const HOME_ORIGIN = "8558 W Catalpa Ave, Chicago, IL 60656";
export const HOME_COORDS = { lat: 41.9804, lng: -87.8407 };
export const CUMBERLAND_STATION = { lat: 41.9842, lng: -87.8403, name: "Cumberland CTA Station (Blue Line)" };

export const CHICAGOLAND_HUBS = [
  { name: "O'Hare International Airport", lat: 41.9742, lng: -87.9073, transitMins: 14, walkMins: 8 },
  { name: "Rosemont Entertainment District", lat: 41.9793, lng: -87.8682, transitMins: 8, walkMins: 10 },
  { name: "Downtown Chicago / Loop (Clark/Lake)", lat: 41.8857, lng: -87.6309, transitMins: 38, walkMins: 10 },
  { name: "Fulton Market / West Loop", lat: 41.8867, lng: -87.6534, transitMins: 42, walkMins: 12 },
  { name: "River North", lat: 41.8924, lng: -87.6341, transitMins: 40, walkMins: 12 },
  { name: "Illinois Medical District / Rush", lat: 41.8708, lng: -87.6744, transitMins: 48, walkMins: 10 },
  { name: "Logan Square", lat: 41.9298, lng: -87.7085, transitMins: 22, walkMins: 8 },
  { name: "Wicker Park / Damen", lat: 41.9103, lng: -87.6778, transitMins: 28, walkMins: 8 },
  { name: "Schaumburg / Woodfield", lat: 42.0468, lng: -88.0336, transitMins: 68, walkMins: 18 },
  { name: "Evanston / Northwestern", lat: 42.0451, lng: -87.6877, transitMins: 65, walkMins: 16 },
  { name: "Oak Brook Office Corridor", lat: 41.8540, lng: -87.9540, transitMins: 75, walkMins: 20 },
  { name: "Naperville Tech Corridor", lat: 41.7508, lng: -88.1535, transitMins: 95, walkMins: 20 },
];

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNextWeekday8AM(): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(8, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() + 1);
  }
  return Math.floor(target.getTime() / 1000);
}

/**
 * Intelligent Chicago Transit Network Model Fallback
 * Works completely offline or when API limits occur
 */
export function estimateChicagoTransit(destAddress: string, destLat?: number, destLng?: number): CommuteResult {
  let lat = destLat;
  let lng = destLng;
  const lowerAddr = destAddress.toLowerCase();

  const matchedHub = CHICAGOLAND_HUBS.find((h) =>
    lowerAddr.includes(h.name.toLowerCase().split("/")[0].trim())
  );

  if (!lat || !lng) {
    if (matchedHub) {
      lat = matchedHub.lat;
      lng = matchedHub.lng;
    } else if (
      lowerAddr.includes("loop") ||
      lowerAddr.includes("clark") ||
      lowerAddr.includes("wacker") ||
      lowerAddr.includes("randolph") ||
      lowerAddr.includes("lasalle") ||
      lowerAddr.includes("60601") ||
      lowerAddr.includes("60602") ||
      lowerAddr.includes("60603") ||
      lowerAddr.includes("60604") ||
      lowerAddr.includes("60606")
    ) {
      lat = 41.8837;
      lng = -87.6324;
    } else if (lowerAddr.includes("o'hare") || lowerAddr.includes("ohare")) {
      lat = 41.9742;
      lng = -87.9073;
    } else if (lowerAddr.includes("rosemont")) {
      lat = 41.9793;
      lng = -87.8682;
    } else if (lowerAddr.includes("fulton") || lowerAddr.includes("west loop")) {
      lat = 41.8867;
      lng = -87.6534;
    } else if (lowerAddr.includes("evanston")) {
      lat = 42.0451;
      lng = -87.6877;
    } else if (lowerAddr.includes("schaumburg")) {
      lat = 42.0468;
      lng = -88.0336;
    } else {
      lat = 41.8781;
      lng = -87.6298;
    }
  }

  const directDistance = haversineDistanceMiles(HOME_COORDS.lat, HOME_COORDS.lng, lat, lng);
  const distFromCumberland = haversineDistanceMiles(CUMBERLAND_STATION.lat, CUMBERLAND_STATION.lng, lat, lng);

  const walkToStationMins = 8;
  const blueLineMins = Math.round((distFromCumberland / 24) * 60) + 4;
  const destWalkMins = Math.min(20, Math.max(5, Math.round(directDistance * 1.5)));

  let totalMins = walkToStationMins + blueLineMins + destWalkMins;
  if (matchedHub) {
    totalMins = matchedHub.transitMins + matchedHub.walkMins;
  }

  const walkingOnlyMinutes = Math.round((directDistance / 3.0) * 60);
  const within1Hour = totalMins <= 60;

  return {
    isEstimateFallback: true,
    within1Hour,
    totalMinutes: totalMins,
    durationText: `${totalMins} mins`,
    totalDistanceText: `${directDistance.toFixed(1)} miles`,
    walkDurationMinutes: walkToStationMins + destWalkMins,
    transitDurationMinutes: Math.max(0, totalMins - (walkToStationMins + destWalkMins)),
    transfers: 0,
    departureTimeText: "Walk to Cumberland Blue Line",
    arrivalTimeText: `Arrive near ${destAddress.split(",")[0]}`,
    walkingOnlyMinutes,
    originAddress: HOME_ORIGIN,
    destinationAddress: destAddress,
    originCoords: HOME_COORDS,
    destinationCoords: { lat, lng },
    transitSteps: [
      {
        travelMode: "WALKING",
        instruction: "Walk east on W Catalpa Ave toward N Cumberland Ave (CTA Station Entrance)",
        durationText: `${walkToStationMins} mins`,
        distanceText: "0.4 mi",
      },
      {
        travelMode: "TRANSIT",
        instruction: "Board CTA Blue Line toward Forest Park or O'Hare",
        durationText: `${blueLineMins} mins`,
        distanceText: `${distFromCumberland.toFixed(1)} mi`,
        transitDetails: {
          lineName: "CTA Blue Line",
          vehicleType: "SUBWAY",
          departureStop: "Cumberland",
          arrivalStop: "Nearest Destination Station",
          color: "#00A1DE",
          textColor: "#FFFFFF",
        },
      },
      {
        travelMode: "WALKING",
        instruction: `Walk from transit stop to target job building at ${destAddress.split(",")[0]}`,
        durationText: `${destWalkMins} mins`,
        distanceText: `${(directDistance * 0.2).toFixed(1)} mi`,
      },
    ],
  };
}

/**
 * Calculates commute directly using Google Routes API v2
 * Works client-side on GitHub Pages without needing a server!
 */
export async function calculateCommuteClientSide(
  destination: string,
  apiKey: string,
  departureMode = "rush_morning"
): Promise<CommuteResult> {
  const trimmedDest = destination.trim();
  const key = apiKey || DEFAULT_MAPS_API_KEY;

  let departureTimestamp = getNextWeekday8AM();
  if (departureMode === "now") {
    departureTimestamp = Math.floor(Date.now() / 1000);
  }

  const departureDate = new Date(departureTimestamp * 1000);

  if (key) {
    try {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { address: HOME_ORIGIN },
          destination: { address: trimmedDest },
          travelMode: "TRANSIT",
          departureTime: departureDate.toISOString(),
          transitPreferences: {
            routingPreference: "FEWER_TRANSFERS",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const primaryRoute = data.routes[0];
          const leg = primaryRoute.legs?.[0] || {};

          let totalSeconds = 0;
          if (primaryRoute.duration) {
            totalSeconds = parseInt(primaryRoute.duration.replace("s", ""), 10);
          }
          const totalMinutes = Math.round(totalSeconds / 60);
          const within1Hour = totalMinutes <= 60;

          let walkSeconds = 0;
          let transitSeconds = 0;
          let transferCount = 0;

          const steps: TransitStep[] = (leg.steps || []).map((step: any) => {
            const isWalk = step.travelMode === "WALK" || step.travelMode === "WALKING";
            const isTransit = step.travelMode === "TRANSIT";

            let stepDurationSec = 0;
            if (step.staticDuration) {
              stepDurationSec = parseInt(step.staticDuration.replace("s", ""), 10);
            }

            if (isWalk) {
              walkSeconds += stepDurationSec;
            } else if (isTransit) {
              transitSeconds += stepDurationSec;
              transferCount++;
            }

            const stepInfo: TransitStep = {
              travelMode: isWalk ? "WALKING" : "TRANSIT",
              instruction: step.navigationInstruction?.instructions || (isWalk ? "Walk to next stop" : "Board transit"),
              durationText: step.localizedValues?.staticDuration?.text || `${Math.round(stepDurationSec / 60)} mins`,
              durationSeconds: stepDurationSec,
              distanceText: step.localizedValues?.distance?.text || "",
              distanceMeters: step.distanceMeters || 0,
            };

            if (step.transitDetails) {
              const td = step.transitDetails;
              stepInfo.transitDetails = {
                lineName: td.transitLine?.name || td.transitLine?.short_name || "Transit Line",
                vehicleType: td.transitLine?.vehicle?.type || "SUBWAY",
                departureStop: td.stopDetails?.departureStop?.name || "",
                arrivalStop: td.stopDetails?.arrivalStop?.name || "",
                numStops: td.stopCount || 1,
                headsign: td.headsign || "",
                color: td.transitLine?.color || "#00A1DE",
                textColor: td.transitLine?.textColor || "#FFFFFF",
              };
            }

            return stepInfo;
          });

          const startCoords = leg.startLocation?.latLng
            ? { lat: leg.startLocation.latLng.latitude, lng: leg.startLocation.latLng.longitude }
            : HOME_COORDS;

          const destCoords = leg.endLocation?.latLng
            ? { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude }
            : { lat: 0, lng: 0 };

          return {
            isEstimateFallback: false,
            within1Hour,
            totalMinutes,
            durationText: leg.localizedValues?.duration?.text || `${totalMinutes} mins`,
            totalDistanceText:
              leg.localizedValues?.distance?.text || `${((primaryRoute.distanceMeters || 0) / 1609.34).toFixed(1)} mi`,
            totalDistanceMeters: primaryRoute.distanceMeters || 0,
            walkDurationMinutes: Math.round(walkSeconds / 60),
            transitDurationMinutes: Math.round(transitSeconds / 60),
            transfers: Math.max(0, transferCount - 1),
            departureTimeText: steps.find((s) => s.transitDetails)?.transitDetails?.departureStop
              ? `Board at ${steps.find((s) => s.transitDetails)?.transitDetails?.departureStop}`
              : "Depart 8558 W Catalpa",
            arrivalTimeText: steps[steps.length - 1]?.instruction || "Destination Arrival",
            originAddress: HOME_ORIGIN,
            destinationAddress: trimmedDest,
            originCoords: startCoords,
            destinationCoords: destCoords,
            overviewPolyline: primaryRoute.polyline?.encodedPolyline || "",
            transitSteps: steps,
          };
        }
      }
    } catch (err) {
      console.warn("Direct Routes API call issue, falling back to local model:", err);
    }
  }

  // Fallback to offline Chicago Transit Network model
  return estimateChicagoTransit(trimmedDest);
}
