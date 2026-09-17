import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const HOME_ORIGIN = "8558 W Catalpa Ave, Chicago, IL 60656";
const HOME_COORDS = { lat: 41.9804, lng: -87.8407 };
const CUMBERLAND_STATION = { lat: 41.9842, lng: -87.8403, name: "Cumberland CTA Station (Blue Line)" };

// Known Chicago job hubs for benchmark estimation fallback
const CHICAGOLAND_HUBS = [
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

function getNextWeekday8AM(): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(8, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  // If Saturday (6) or Sunday (0), advance to Monday
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() + 1);
  }
  return Math.floor(target.getTime() / 1000);
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
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

// Fallback estimation model specifically for 8558 W Catalpa
function estimateChicagoTransitCommute(destAddress: string, destLat?: number, destLng?: number) {
  let lat = destLat;
  let lng = destLng;
  const lowerAddr = destAddress.toLowerCase();

  // Find if matching known hub
  const matchedHub = CHICAGOLAND_HUBS.find(h => lowerAddr.includes(h.name.toLowerCase().split('/')[0].trim()));

  if (!lat || !lng) {
    if (matchedHub) {
      lat = matchedHub.lat;
      lng = matchedHub.lng;
    } else if (lowerAddr.includes("loop") || lowerAddr.includes("clark") || lowerAddr.includes("wacker") || lowerAddr.includes("lasalle") || lowerAddr.includes("michigan ave") || lowerAddr.includes("chicago, il 60601") || lowerAddr.includes("chicago, il 60602") || lowerAddr.includes("chicago, il 60603") || lowerAddr.includes("chicago, il 60604") || lowerAddr.includes("chicago, il 60606")) {
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
      // Default to Chicago center if unknown
      lat = 41.8781;
      lng = -87.6298;
    }
  }

  const directDistance = haversineDistanceMiles(HOME_COORDS.lat, HOME_COORDS.lng, lat, lng);
  const distFromCumberland = haversineDistanceMiles(CUMBERLAND_STATION.lat, CUMBERLAND_STATION.lng, lat, lng);

  // Walk to Cumberland Blue Line station: 0.4 miles = ~8 mins walk
  const walkToStationMins = 8;
  // Train average speed on Blue Line ~24 mph including stops
  const blueLineMins = Math.round((distFromCumberland / 24) * 60) + 4;
  // Destination walk average 8-12 mins
  const destWalkMins = Math.min(20, Math.max(5, Math.round(directDistance * 1.5)));

  let totalMins = walkToStationMins + blueLineMins + destWalkMins;
  if (matchedHub) {
    totalMins = matchedHub.transitMins + matchedHub.walkMins;
  }

  // Pure walking calculation (approx 3.0 mph)
  const walkingOnlyMinutes = Math.round((directDistance / 3.0) * 60);

  const within1Hour = totalMins <= 60;

  return {
    isEstimateFallback: true,
    within1Hour,
    totalMinutes: totalMins,
    totalDistanceText: `${directDistance.toFixed(1)} miles`,
    walkDurationMinutes: walkToStationMins + destWalkMins,
    transitDurationMinutes: Math.max(0, totalMins - (walkToStationMins + destWalkMins)),
    walkingOnlyMinutes,
    originAddress: HOME_ORIGIN,
    destinationAddress: destAddress,
    originCoords: HOME_COORDS,
    destinationCoords: { lat, lng },
    transitSteps: [
      {
        travelMode: "WALKING",
        instruction: "Walk from 8558 W Catalpa Ave to Cumberland CTA Station (Blue Line)",
        durationText: `${walkToStationMins} mins`,
        distanceText: "0.4 mi",
      },
      {
        travelMode: "TRANSIT",
        instruction: `Board CTA Blue Line toward Forest Park or O'Hare`,
        durationText: `${blueLineMins} mins`,
        distanceText: `${distFromCumberland.toFixed(1)} mi`,
        transitDetails: {
          lineName: "Blue Line",
          vehicleType: "SUBWAY",
          departureStop: "Cumberland",
          arrivalStop: "Destination Station or Transfer Station",
          color: "#00A1DE",
          textColor: "#FFFFFF",
        },
      },
      {
        travelMode: "WALKING",
        instruction: `Walk to job location at ${destAddress}`,
        durationText: `${destWalkMins} mins`,
        distanceText: `${(directDistance * 0.2).toFixed(1)} mi`,
      },
    ],
  };
}

// API: Config endpoint for front-end maps initialization
app.get("/api/config", (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "";
  res.json({
    hasApiKey: Boolean(apiKey),
    apiKey: apiKey,
    homeOrigin: HOME_ORIGIN,
    homeCoords: HOME_COORDS,
  });
});

// API: Autocomplete suggestions for Chicago job locations
app.get("/api/autocomplete", async (req, res) => {
  const input = (req.query.input as string) || "";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!input || input.trim().length < 2) {
    return res.json({ predictions: [] });
  }

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&location=${HOME_COORDS.lat},${HOME_COORDS.lng}&radius=40000&components=country:us&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.predictions) {
        const predictions = data.predictions.map((p: any) => ({
          description: p.description,
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || "",
        }));
        return res.json({ predictions });
      }
    } catch (err) {
      console.warn("Places autocomplete failed:", err);
    }
  }

  // Resilient fallback suggestions around Chicago
  const sampleSuggestions = [
    "O'Hare International Airport, Chicago, IL",
    "100 S Wacker Dr, Chicago, IL 60606",
    "111 W Jackson Blvd, Chicago, IL 60604",
    "Merchandise Mart, 222 W Merchandise Mart Plaza, Chicago, IL 60654",
    "Fulton Market District, Chicago, IL",
    "Rush University Medical Center, 1653 W Congress Pkwy, Chicago, IL",
    "Rosemont Theatre, 5400 N River Rd, Rosemont, IL",
    "Woodfield Mall, Schaumburg, IL",
    "Northwestern University, Evanston, IL",
    "Willis Tower, 233 S Wacker Dr, Chicago, IL",
    "Navy Pier, 600 E Grand Ave, Chicago, IL",
    "UIC East Campus, 1200 W Harrison St, Chicago, IL",
  ];

  const filtered = sampleSuggestions
    .filter(s => s.toLowerCase().includes(input.toLowerCase()))
    .map(s => ({
      description: s,
      placeId: s,
      mainText: s.split(",")[0],
      secondaryText: s.split(",").slice(1).join(",").trim(),
    }));

  return res.json({ predictions: filtered });
});

// API: Check commute within 1 hour
app.post("/api/commute", async (req, res) => {
  try {
    const { destination, departureMode = "rush_morning", customTimestamp } = req.body;

    if (!destination || typeof destination !== "string" || !destination.trim()) {
      return res.status(400).json({ error: "Destination address is required." });
    }

    const trimmedDest = destination.trim();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    let departureTime: number;
    if (departureMode === "rush_morning") {
      departureTime = getNextWeekday8AM();
    } else if (departureMode === "now") {
      departureTime = Math.floor(Date.now() / 1000);
    } else if (departureMode === "custom" && customTimestamp) {
      departureTime = Number(customTimestamp);
    } else {
      departureTime = getNextWeekday8AM();
    }

    if (apiKey) {
      try {
        // Convert departureTime to ISO string for Routes API
        const departureDate = new Date(departureTime * 1000);
        const departureIsoString = departureDate.toISOString();

        // 1. Call Google Routes API v2 computeRoutes
        const routesResponse = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify({
            origin: { address: HOME_ORIGIN },
            destination: { address: trimmedDest },
            travelMode: "TRANSIT",
            departureTime: departureIsoString,
            transitPreferences: {
              routingPreference: "FEWER_TRANSFERS",
            },
          }),
        });

        const routesData = await routesResponse.json();

        if (routesData.routes && routesData.routes.length > 0) {
          const primaryRoute = routesData.routes[0];
          const leg = primaryRoute.legs?.[0] || {};

          // Parse duration (format in seconds e.g. "3198s")
          let totalSeconds = 0;
          if (primaryRoute.duration) {
            totalSeconds = parseInt(primaryRoute.duration.replace("s", ""), 10);
          }
          const totalMinutes = Math.round(totalSeconds / 60);
          const within1Hour = totalMinutes <= 60;

          let walkSeconds = 0;
          let transitSeconds = 0;
          let transferCount = 0;

          const steps = (leg.steps || []).map((step: any) => {
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

            const stepInfo: any = {
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

          // Check if walking-only route is viable (if distance < 6500 meters)
          let walkingOnlyMinutes: number | null = null;
          if (primaryRoute.distanceMeters && primaryRoute.distanceMeters < 6500) {
            try {
              const walkRes = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": apiKey,
                  "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
                },
                body: JSON.stringify({
                  origin: { address: HOME_ORIGIN },
                  destination: { address: trimmedDest },
                  travelMode: "WALK",
                }),
              });
              const walkData = await walkRes.json();
              if (walkData.routes?.[0]?.duration) {
                const walkSec = parseInt(walkData.routes[0].duration.replace("s", ""), 10);
                walkingOnlyMinutes = Math.round(walkSec / 60);
              }
            } catch {
              // Non-fatal
            }
          }

          const startCoords = leg.startLocation?.latLng ? {
            lat: leg.startLocation.latLng.latitude,
            lng: leg.startLocation.latLng.longitude,
          } : HOME_COORDS;

          const destCoords = leg.endLocation?.latLng ? {
            lat: leg.endLocation.latLng.latitude,
            lng: leg.endLocation.latLng.longitude,
          } : { lat: 0, lng: 0 };

          return res.json({
            isEstimateFallback: false,
            within1Hour,
            totalMinutes,
            durationText: leg.localizedValues?.duration?.text || `${totalMinutes} mins`,
            totalDistanceText: leg.localizedValues?.distance?.text || `${((primaryRoute.distanceMeters || 0) / 1609.34).toFixed(1)} mi`,
            totalDistanceMeters: primaryRoute.distanceMeters || 0,
            walkDurationMinutes: Math.round(walkSeconds / 60),
            transitDurationMinutes: Math.round(transitSeconds / 60),
            transfers: Math.max(0, transferCount - 1),
            departureTimeText: steps.find((s: any) => s.transitDetails)?.transitDetails?.departureStop
              ? `Board at ${steps.find((s: any) => s.transitDetails)?.transitDetails?.departureStop}`
              : "Depart 8558 W Catalpa",
            arrivalTimeText: steps[steps.length - 1]?.instruction || "Destination Arrival",
            originAddress: HOME_ORIGIN,
            destinationAddress: trimmedDest,
            originCoords: startCoords,
            destinationCoords: destCoords,
            overviewPolyline: primaryRoute.polyline?.encodedPolyline || "",
            transitSteps: steps,
            walkingOnlyMinutes,
          });
        } else {
          console.warn("Routes API returned no routes:", routesData);
          const fallbackData = estimateChicagoTransitCommute(trimmedDest);
          return res.json({
            ...fallbackData,
            apiWarning: routesData.error?.message || "No transit route found from Google Routes API. Chicago Transit Model applied.",
          });
        }
      } catch (apiErr: any) {
        console.error("Error contacting Google Routes API:", apiErr);
        const fallbackData = estimateChicagoTransitCommute(trimmedDest);
        return res.json({
          ...fallbackData,
          apiWarning: "Routes API network error. Fallback CTA commute estimation applied.",
        });
      }
    } else {
      // No API key provided, use CTA matrix model
      const fallbackData = estimateChicagoTransitCommute(trimmedDest);
      return res.json(fallbackData);
    }
  } catch (error: any) {
    console.error("Commute API error:", error);
    res.status(500).json({ error: "Failed to calculate commute. Please verify the address." });
  }
});

// Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Commute Verifier server running on http://localhost:${PORT}`);
  });
}

startServer();
