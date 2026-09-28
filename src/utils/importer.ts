import JSZip from 'jszip';
import { LatLon } from '../types/drone';

/**
 * Extracts polygon coordinates from KML string
 */
export function extractPolygonFromKml(kmlText: string): LatLon[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, 'application/xml');

  // Look for <Polygon> -> <outerBoundaryIs> -> <LinearRing> -> <coordinates>
  const coordNodes = xml.querySelectorAll('Polygon coordinates, coordinates');
  for (let i = 0; i < coordNodes.length; i++) {
    const raw = coordNodes[i].textContent?.trim() || '';
    if (!raw) continue;

    // Split on whitespace / newlines
    const pointsStr = raw.split(/\s+/);
    const coords: LatLon[] = [];

    for (const pt of pointsStr) {
      if (!pt.trim()) continue;
      const parts = pt.split(',');
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          coords.push({ lat, lon });
        }
      }
    }

    if (coords.length >= 3) {
      // Remove last point if duplicate of first
      if (
        coords.length > 3 &&
        coords[0].lat === coords[coords.length - 1].lat &&
        coords[0].lon === coords[coords.length - 1].lon
      ) {
        coords.pop();
      }
      return coords;
    }
  }

  return [];
}

/**
 * Extracts polygon coordinates from GeoJSON string
 */
export function extractPolygonFromGeoJson(geoJsonText: string): LatLon[] {
  try {
    const parsed = JSON.parse(geoJsonText);
    let polygonCoordinates: number[][][] | null = null;

    if (parsed.type === 'FeatureCollection' && parsed.features?.length) {
      const polyFeature = parsed.features.find(
        (f: any) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );
      if (polyFeature) {
        if (polyFeature.geometry.type === 'Polygon') {
          polygonCoordinates = polyFeature.geometry.coordinates;
        } else if (polyFeature.geometry.type === 'MultiPolygon') {
          polygonCoordinates = polyFeature.geometry.coordinates[0];
        }
      }
    } else if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon') {
      polygonCoordinates = parsed.geometry.coordinates;
    } else if (parsed.type === 'Polygon') {
      polygonCoordinates = parsed.coordinates;
    }

    if (polygonCoordinates && polygonCoordinates.length > 0) {
      const ring = polygonCoordinates[0];
      const coords: LatLon[] = ring
        .map((c) => ({ lat: c[1], lon: c[0] }))
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));

      if (
        coords.length > 3 &&
        coords[0].lat === coords[coords.length - 1].lat &&
        coords[0].lon === coords[coords.length - 1].lon
      ) {
        coords.pop();
      }
      return coords;
    }
  } catch (e) {
    console.error('GeoJSON parse error:', e);
  }
  return [];
}

/**
 * Handles file reading for .kml, .kmz, .geojson, .json
 */
export async function parsePolygonFile(file: File): Promise<LatLon[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'kmz') {
    const zip = await JSZip.loadAsync(file);
    // Find .kml inside kmz
    const kmlFile = Object.values(zip.files).find((f) => f.name.toLowerCase().endsWith('.kml'));
    if (!kmlFile) throw new Error('No se encontró ningún archivo KML dentro del archivo KMZ.');
    const kmlContent = await kmlFile.async('text');
    const pts = extractPolygonFromKml(kmlContent);
    if (!pts.length) throw new Error('No se encontró ningún polígono válido dentro del KML.');
    return pts;
  }

  const text = await file.text();

  if (extension === 'kml') {
    const pts = extractPolygonFromKml(text);
    if (!pts.length) throw new Error('No se encontró un polígono con coordenadas válidas en el archivo KML.');
    return pts;
  }

  if (extension === 'geojson' || extension === 'json') {
    const pts = extractPolygonFromGeoJson(text);
    if (!pts.length) throw new Error('No se encontró un polígono válido en el archivo GeoJSON.');
    return pts;
  }

  throw new Error('Formato no soportado. Por favor sube un archivo .kml, .kmz o .geojson.');
}
