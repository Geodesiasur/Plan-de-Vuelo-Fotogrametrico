import { CameraMode } from '../types/drone';

/**
 * Calculates Ground Sampling Distance (GSD) in cm/pixel from flight altitude.
 * GSD = (H * Sw) / (f * ImgW) * 100
 * where:
 * - H = flight height in meters
 * - Sw = sensor width in mm
 * - f = focal length in mm
 * - ImgW = image width in pixels
 */
export function calcGsdFromHeight(heightM: number, cam: CameraMode): number {
  if (!cam || !cam.f || !cam.resW || heightM <= 0) return 0;
  const gsdM = (heightM * cam.sensorW) / (cam.f * cam.resW);
  return gsdM * 100; // cm/px
}

/**
 * Calculates flight altitude (meters) required to achieve a target GSD in cm/pixel.
 * H = (GSD / 100) * (f * ImgW) / Sw
 */
export function calcHeightFromGsd(gsdCm: number, cam: CameraMode): number {
  if (!cam || !cam.sensorW || gsdCm <= 0) return 0;
  return (gsdCm / 100) * (cam.f * cam.resW) / cam.sensorW;
}

/**
 * Computes single photo footprint dimensions on the ground at a given altitude.
 */
export function computeFootprint(heightM: number, cam: CameraMode) {
  if (!cam || !cam.f || heightM <= 0) {
    return { groundWidthM: 0, groundHeightM: 0, areaM2: 0, gsdW: 0, gsdH: 0 };
  }
  const groundWidthM = (heightM * cam.sensorW) / cam.f;
  const groundHeightM = (heightM * cam.sensorH) / cam.f;
  const areaM2 = groundWidthM * groundHeightM;
  const gsdW = (groundWidthM / cam.resW) * 100; // cm/px
  const gsdH = (groundHeightM / cam.resH) * 100; // cm/px

  return { groundWidthM, groundHeightM, areaM2, gsdW, gsdH };
}

/**
 * Distance between parallel flight flight lines (transversal spacing)
 * based on side overlap %.
 */
export function calcRouteSpacing(groundWidthM: number, sideOverlapPercent: number): number {
  const overlapFrac = Math.min(0.95, Math.max(0.1, sideOverlapPercent / 100));
  return Math.max(0.5, groundWidthM * (1 - overlapFrac));
}

/**
 * Distance between consecutive camera triggers along the flight path (longitudinal spacing)
 * based on front overlap %.
 */
export function calcWaypointSpacing(groundHeightM: number, frontOverlapPercent: number): number {
  const overlapFrac = Math.min(0.95, Math.max(0.1, frontOverlapPercent / 100));
  return Math.max(0.5, groundHeightM * (1 - overlapFrac));
}

/**
 * Recommended camera trigger interval in seconds for DJI interval shooting.
 */
export function calcRecommendedInterval(waypointSpacingM: number, speedMs: number): number {
  if (speedMs <= 0) return 2.0;
  const sec = waypointSpacingM / speedMs;
  return Math.max(1.0, parseFloat(sec.toFixed(1)));
}

/**
 * Formats duration in seconds to "Xm Ys" or "Xh Ym Zs"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0m 0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Formats distance in meters or kilometers
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

/**
 * Formats area in m² and hectares
 */
export function formatArea(areaM2: number): { m2: string; ha: string } {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return { m2: '0 m²', ha: '0.00 ha' };
  const ha = (areaM2 / 10000).toFixed(2);
  const m2 = Math.round(areaM2).toLocaleString('es-ES');
  return { m2: `${m2} m²`, ha: `${ha} ha` };
}
