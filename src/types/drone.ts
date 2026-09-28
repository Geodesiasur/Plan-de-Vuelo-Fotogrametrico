export interface CameraMode {
  key: string;
  label: string;
  sensorW: number; // mm
  sensorH: number; // mm
  resW: number;    // px
  resH: number;    // px
  f: number;       // focal length in mm
  aspectRatio: string;
  megapixels: number;
}

export interface DroneSpecs {
  id: string;
  name: string;
  brand: string;
  hasSdk: boolean; // whether DJI released MSDK
  supportedInDjiFlyWaypoints: boolean; // Mini 4 Pro, Air 3, Mavic 3 support native waypoints
  batteryTimeMinutes: number; // realistic flight time with 20% margin
  maxSpeedMs: number;
  weightGrams: number;
  shutterType: 'Electronic' | 'Mechanical';
  modes: CameraMode[];
  notes?: string;
}

export type FlightPattern = 'grid' | 'double_grid' | 'corridor';
export type HeightMode = 'relative' | 'agl';
export type CaptureMode = 'waypoint' | 'interval';
export type CameraAction = 'photo' | 'record' | 'none';
export type FinishAction = 'rth' | 'hover' | 'land' | 'wp1';

export interface FlightSettings {
  droneId: string;
  droneModeKey: string;
  heightM: number;
  gsdCm: number;
  speedMs: number;
  frontOverlap: number; // % (longitudinal)
  sideOverlap: number;  // % (transversal)
  bufferM: number;      // expansion margin around polygon
  gimbalPitch: number;  // degrees (e.g. -90 for nadir)
  orientationAngle: number; // degrees 0-360
  orientationMode: 'auto' | 'manual';
  pattern: FlightPattern;
  heightMode: HeightMode;
  captureMode: CaptureMode;
  cameraAction: CameraAction;
  finishAction: FinishAction;
}

export interface LatLon {
  lat: number;
  lon: number;
}

export interface WaypointItem {
  index: number;
  lat: number;
  lon: number;
  heightM: number;
  heading: number; // 0-360 deg
  gimbalPitch: number;
  speedMs: number;
  turnType?: 'straight' | 'curved';
  action?: 'photo' | 'none';
  terrainElevationM?: number;
  aglHeightM?: number;
  legDistanceM?: number;
}

export interface FlightPlanMetrics {
  totalDistanceM: number;
  flightTimeSec: number;
  areaM2: number;
  areaHectares: number;
  photoCount: number;
  estimatedBatteries: number;
  lineCount: number;
  turnCount: number;
  routeSpacingM: number;
  waypointSpacingM: number;
  recommendedIntervalSec: number;
  footprintWidthM: number;
  footprintHeightM: number;
  footprintAreaM2: number;
  optimalOrientationDeg: number;
}

export interface FlightPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  takeoff: LatLon | null;
  polygon: LatLon[];
  settings: FlightSettings;
  waypoints: WaypointItem[];
  metrics: FlightPlanMetrics;
}
