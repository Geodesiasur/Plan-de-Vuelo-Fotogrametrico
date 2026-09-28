import * as turf from '@turf/turf';
import { CameraMode, FlightPlanMetrics, FlightSettings, LatLon, WaypointItem } from '../types/drone';
import {
  calcGsdFromHeight,
  calcRecommendedInterval,
  calcRouteSpacing,
  calcWaypointSpacing,
  computeFootprint,
} from './photogrammetry';

/**
 * Normalizes an angle into [0, 360)
 */
export function normalizeAngle360(deg: number): number {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
}

/**
 * Normalizes an angle into [0, 180)
 */
export function normalizeAngle180(deg: number): number {
  let a = deg % 180;
  if (a < 0) a += 180;
  return a;
}

/**
 * Converts array of LatLon to a GeoJSON Polygon
 */
export function latLonToPolygon(points: LatLon[]): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (!points || points.length < 3) return null;
  const coords = points.map((p) => [p.lon, p.lat]);
  // Ensure polygon is closed
  if (
    coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1]
  ) {
    coords.push([...coords[0]]);
  }
  try {
    return turf.polygon([coords]);
  } catch (e) {
    console.error('Failed to construct polygon:', e);
    return null;
  }
}

/**
 * Applies a safety buffer (meters) to the polygon
 */
export function applyBuffer(
  poly: GeoJSON.Feature<GeoJSON.Polygon>,
  bufferM: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  if (bufferM === 0) return poly;
  try {
    const buffered = turf.buffer(poly, bufferM / 1000, { units: 'kilometers' });
    if (buffered && buffered.geometry.type === 'Polygon') {
      return buffered as GeoJSON.Feature<GeoJSON.Polygon>;
    }
  } catch (e) {
    console.warn('Buffer application failed, using original polygon', e);
  }
  return poly;
}

/**
 * Generates parallel line segments that intersect the polygon at angleDeg
 */
export function generateParallelSegments(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  spacingM: number,
  angleDeg: number
): GeoJSON.Feature<GeoJSON.LineString>[] {
  const result: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  try {
    const center = turf.center(polygon);
    // Rotate polygon by -angleDeg around center to align with X axis
    const rotated = turf.transformRotate(polygon, -angleDeg, { pivot: center });
    const bbox = turf.bbox(rotated); // [minX, minY, maxX, maxY]

    const minY = bbox[1];
    const maxY = bbox[3];
    const minX = bbox[0];
    const maxX = bbox[2];

    // Compute latitude spacing in degrees (approx 111,139 meters per degree of latitude)
    const latSpanM = turf.distance([minX, minY], [minX, maxY], { units: 'kilometers' }) * 1000;
    const numLines = Math.max(1, Math.ceil(latSpanM / spacingM));
    const stepDeg = (maxY - minY) / (numLines + 1);

    // Bounding line extended by 20%
    const xSpan = maxX - minX;
    const lineMinX = minX - xSpan * 0.1;
    const lineMaxX = maxX + xSpan * 0.1;

    for (let i = 1; i <= numLines; i++) {
      const y = minY + i * stepDeg;
      const hLine = turf.lineString([
        [lineMinX, y],
        [lineMaxX, y],
      ]);

      // Intersect horizontal line with rotated polygon
      const split = turf.lineSplit(hLine, rotated);
      if (!split || !split.features.length) continue;

      // Filter segments inside polygon
      for (const seg of split.features) {
        const midPoint = turf.midpoint(
          turf.point(seg.geometry.coordinates[0]),
          turf.point(seg.geometry.coordinates[seg.geometry.coordinates.length - 1])
        );
        if (turf.booleanPointInPolygon(midPoint, rotated)) {
          // Rotate segment back
          const unrotated = turf.transformRotate(seg, angleDeg, { pivot: center });
          result.push(unrotated);
        }
      }
    }
  } catch (err) {
    console.error('Error generating parallel segments:', err);
  }
  return result;
}

/**
 * Densifies a line segment between two coordinates into waypoints spaced by distM
 */
export function densifyLine(
  p1: [number, number],
  p2: [number, number],
  distM: number
): [number, number][] {
  const lengthM = turf.distance(p1, p2, { units: 'kilometers' }) * 1000;

  if (lengthM <= distM) {
    return [p1, p2];
  }

  const numSteps = Math.max(1, Math.round(lengthM / distM));
  const points: [number, number][] = [];

  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    const lon = p1[0] + (p2[0] - p1[0]) * fraction;
    const lat = p1[1] + (p2[1] - p1[1]) * fraction;
    points.push([lon, lat]);
  }

  return points;
}

/**
 * Densifies a line segment into waypoints spaced by distM
 */
export function densifySegment(
  segment: GeoJSON.Feature<GeoJSON.LineString>,
  distM: number
): [number, number][] {
  const coords = segment.geometry.coordinates;
  if (coords.length < 2) return coords as [number, number][];
  return densifyLine(coords[0] as [number, number], coords[coords.length - 1] as [number, number], distM);
}

/**
 * Builds a true serpentine (zigzag / boustrophedon) path for a set of parallel flight lines,
 * ensuring each line enters at the endpoint nearest to the previous line exit point.
 * This avoids long diagonal jumps between distant points.
 */
export function buildSerpentinePath(
  segments: GeoJSON.Feature<GeoJSON.LineString>[],
  startReference: [number, number] | null,
  captureMode: 'waypoint' | 'interval',
  waypointSpacingM: number
): [number, number][] {
  if (!segments.length) return [];

  // Determine optimal line traversal order: forward (0 -> N-1) or reverse (N-1 -> 0)
  // based on proximity to the startReference (e.g. takeoff point)
  let orderedSegments = [...segments];
  if (startReference && orderedSegments.length > 1) {
    const firstCoords = orderedSegments[0].geometry.coordinates;
    const firstStart = firstCoords[0] as [number, number];
    const firstEnd = firstCoords[firstCoords.length - 1] as [number, number];
    const distToFirstLine = Math.min(
      turf.distance(startReference, firstStart, { units: 'kilometers' }),
      turf.distance(startReference, firstEnd, { units: 'kilometers' })
    );

    const lastIdx = orderedSegments.length - 1;
    const lastCoords = orderedSegments[lastIdx].geometry.coordinates;
    const lastStart = lastCoords[0] as [number, number];
    const lastEnd = lastCoords[lastCoords.length - 1] as [number, number];
    const distToLastLine = Math.min(
      turf.distance(startReference, lastStart, { units: 'kilometers' }),
      turf.distance(startReference, lastEnd, { units: 'kilometers' })
    );

    if (distToLastLine < distToFirstLine) {
      orderedSegments.reverse();
    }
  }

  const resultWaypoints: [number, number][] = [];
  let currentPos: [number, number] | null = startReference;

  for (let i = 0; i < orderedSegments.length; i++) {
    const coords = orderedSegments[i].geometry.coordinates;
    const ptA = coords[0] as [number, number];
    const ptB = coords[coords.length - 1] as [number, number];

    let startPt: [number, number];
    let endPt: [number, number];

    if (!currentPos) {
      // First line without reference: start at ptA, go to ptB
      startPt = ptA;
      endPt = ptB;
    } else {
      // Choose the endpoint of this segment that is closest to currentPos
      const distA = turf.distance(currentPos, ptA, { units: 'kilometers' });
      const distB = turf.distance(currentPos, ptB, { units: 'kilometers' });

      if (distB < distA) {
        startPt = ptB;
        endPt = ptA;
      } else {
        startPt = ptA;
        endPt = ptB;
      }
    }

    // Generate waypoints along this directed line segment
    if (captureMode === 'interval') {
      const prev = resultWaypoints[resultWaypoints.length - 1];
      if (!prev || prev[0] !== startPt[0] || prev[1] !== startPt[1]) {
        resultWaypoints.push(startPt);
      }
      if (endPt[0] !== startPt[0] || endPt[1] !== startPt[1]) {
        resultWaypoints.push(endPt);
      }
    } else {
      // Waypoint mode: densify smoothly from startPt to endPt
      const points = densifyLine(startPt, endPt, waypointSpacingM);
      for (const pt of points) {
        const prev = resultWaypoints[resultWaypoints.length - 1];
        if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
          resultWaypoints.push(pt);
        }
      }
    }

    // Update currentPos to the exit point of this segment
    currentPos = endPt;
  }

  return resultWaypoints;
}

/**
 * Finds the optimal angle for minimum path length and turns
 */
export function findOptimalAngle(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  routeSpacingM: number,
  takeoff: LatLon | null
): number {
  let bestAngle = 0;
  let minCost = Infinity;

  // Test every 10 degrees from 0 to 170
  for (let angle = 0; angle < 180; angle += 10) {
    const segments = generateParallelSegments(polygon, routeSpacingM, angle);
    if (!segments.length) continue;

    let totalLength = 0;
    for (const seg of segments) {
      totalLength += turf.length(seg, { units: 'kilometers' }) * 1000;
    }

    // Penalize turns: fewer lines = fewer turns!
    // Each turn adds ~20 meters of turning and acceleration
    const turnPenalty = segments.length * 25;
    let takeoffDist = 0;
    if (takeoff && segments.length > 0) {
      const firstCoord = segments[0].geometry.coordinates[0];
      takeoffDist =
        turf.distance([takeoff.lon, takeoff.lat], firstCoord, { units: 'kilometers' }) * 1000;
    }

    const cost = totalLength + turnPenalty + takeoffDist;
    if (cost < minCost) {
      minCost = cost;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Main function to generate complete flight plan
 */
export function generateFlightPlan(
  polygonPoints: LatLon[],
  takeoff: LatLon | null,
  settings: FlightSettings,
  cam: CameraMode,
  droneBatteryMinutes: number = 25
): { waypoints: WaypointItem[]; metrics: FlightPlanMetrics } | null {
  const poly = latLonToPolygon(polygonPoints);
  if (!poly) return null;

  const footprint = computeFootprint(settings.heightM, cam);
  const routeSpacingM = calcRouteSpacing(footprint.groundWidthM, settings.sideOverlap);
  const waypointSpacingM = calcWaypointSpacing(footprint.groundHeightM, settings.frontOverlap);
  const recommendedIntervalSec = calcRecommendedInterval(waypointSpacingM, settings.speedMs);

  const bufferedPoly = applyBuffer(poly, settings.bufferM);

  // Determine angle
  let angle = settings.orientationAngle;
  let optimalAngle = 0;
  try {
    optimalAngle = findOptimalAngle(bufferedPoly, routeSpacingM, takeoff);
  } catch (e) {
    optimalAngle = 0;
  }

  if (settings.orientationMode === 'auto') {
    angle = optimalAngle;
  }

  // Generate primary pass
  const primarySegments = generateParallelSegments(bufferedPoly, routeSpacingM, angle);

  if (!primarySegments.length) {
    return null;
  }

  const takeoffCoords: [number, number] | null = takeoff ? [takeoff.lon, takeoff.lat] : null;

  // Build primary serpentine trajectory (strictly alternating directions, no cross-site jumps)
  const rawWaypointsLonLat: [number, number][] = buildSerpentinePath(
    primarySegments,
    takeoffCoords,
    settings.captureMode,
    waypointSpacingM
  );

  let totalLineCount = primarySegments.length;

  // If double grid is active, generate orthogonal second pass at angle + 90°
  if (settings.pattern === 'double_grid') {
    const crossSegments = generateParallelSegments(bufferedPoly, routeSpacingM, (angle + 90) % 180);
    if (crossSegments.length > 0) {
      totalLineCount += crossSegments.length;
      const lastPrimaryPoint = rawWaypointsLonLat[rawWaypointsLonLat.length - 1] || takeoffCoords;
      const crossWaypoints = buildSerpentinePath(
        crossSegments,
        lastPrimaryPoint,
        settings.captureMode,
        waypointSpacingM
      );
      for (const pt of crossWaypoints) {
        const prev = rawWaypointsLonLat[rawWaypointsLonLat.length - 1];
        if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
          rawWaypointsLonLat.push(pt);
        }
      }
    }
  }

  if (!rawWaypointsLonLat.length) {
    return null;
  }

  // Build WaypointItems
  let totalDistanceM = 0;
  const waypoints: WaypointItem[] = [];

  for (let idx = 0; idx < rawWaypointsLonLat.length; idx++) {
    const curr = rawWaypointsLonLat[idx];
    let heading = 0;

    if (idx < rawWaypointsLonLat.length - 1) {
      heading = Math.round(turf.bearing(turf.point(curr), turf.point(rawWaypointsLonLat[idx + 1])));
    } else if (idx > 0) {
      heading = Math.round(turf.bearing(turf.point(rawWaypointsLonLat[idx - 1]), turf.point(curr)));
    }
    heading = normalizeAngle360(heading);

    let legDist = 0;
    if (idx > 0) {
      legDist =
        turf.distance(rawWaypointsLonLat[idx - 1], curr, { units: 'kilometers' }) * 1000;
      totalDistanceM += legDist;
    }

    waypoints.push({
      index: idx + 1,
      lon: curr[0],
      lat: curr[1],
      heightM: settings.heightM,
      heading,
      gimbalPitch: settings.gimbalPitch,
      speedMs: settings.speedMs,
      action: settings.captureMode === 'waypoint' ? 'photo' : 'none',
      legDistanceM: legDist,
    });
  }

  // Calculate mission metrics
  const areaM2 = turf.area(poly);
  const areaHectares = areaM2 / 10000;
  const flightTimeSec = totalDistanceM / Math.max(0.5, settings.speedMs);

  let photoCount = 0;
  if (settings.captureMode === 'waypoint') {
    photoCount = waypoints.length;
  } else {
    photoCount = Math.max(1, Math.ceil(totalDistanceM / Math.max(1, waypointSpacingM)));
  }

  // Battery calculations: safe flight time is droneBatteryMinutes * 60 * 0.75 (reserving 25% for RTH)
  const safeBatterySec = droneBatteryMinutes * 60 * 0.75;
  const estimatedBatteries = Math.max(1, Math.ceil(flightTimeSec / safeBatterySec));

  const metrics: FlightPlanMetrics = {
    totalDistanceM,
    flightTimeSec,
    areaM2,
    areaHectares,
    photoCount,
    estimatedBatteries,
    lineCount: totalLineCount,
    turnCount: Math.max(0, totalLineCount - 1),
    routeSpacingM,
    waypointSpacingM,
    recommendedIntervalSec,
    footprintWidthM: footprint.groundWidthM,
    footprintHeightM: footprint.groundHeightM,
    footprintAreaM2: footprint.areaM2,
    optimalOrientationDeg: optimalAngle,
  };

  return { waypoints, metrics };
}
