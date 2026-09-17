export interface TransitDetails {
  lineName: string;
  vehicleType: string;
  departureStop: string;
  arrivalStop: string;
  numStops?: number;
  headsign?: string;
  color?: string;
  textColor?: string;
}

export interface TransitStep {
  travelMode: "WALKING" | "TRANSIT" | string;
  instruction: string;
  durationText: string;
  durationSeconds?: number;
  distanceText: string;
  distanceMeters?: number;
  transitDetails?: TransitDetails;
}

export interface AlternativeOption {
  optionIndex: number;
  totalMinutes: number;
  within1Hour: boolean;
  summary: string;
  distanceText: string;
}

export interface CommuteResult {
  isEstimateFallback?: boolean;
  apiWarning?: string;
  within1Hour: boolean;
  totalMinutes: number;
  durationText?: string;
  totalDistanceText: string;
  totalDistanceMeters?: number;
  walkDurationMinutes: number;
  transitDurationMinutes: number;
  transfers?: number;
  departureTimeText?: string;
  arrivalTimeText?: string;
  originAddress: string;
  destinationAddress: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  overviewPolyline?: string;
  transitSteps: TransitStep[];
  alternativeOptions?: AlternativeOption[];
  walkingOnlyMinutes?: number | null;
}

export interface JobHistoryItem {
  id: string;
  jobTitle?: string;
  companyName?: string;
  address: string;
  totalMinutes: number;
  within1Hour: boolean;
  transfers?: number;
  walkMinutes: number;
  transitMinutes: number;
  checkedAt: string;
}
