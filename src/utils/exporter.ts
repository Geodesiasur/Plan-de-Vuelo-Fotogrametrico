import JSZip from 'jszip';
import { FlightPlan, LatLon, WaypointItem } from '../types/drone';

/**
 * Downloads a Blob as a file with a given filename
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates Standard KML XML
 */
export function generateStandardKml(plan: FlightPlan): string {
  const { takeoff, polygon, waypoints, settings, metrics, name } = plan;

  const polyCoordsStr = polygon
    .map((p) => `${p.lon},${p.lat},0`)
    .concat(polygon.length ? [`${polygon[0].lon},${polygon[0].lat},0`] : [])
    .join(' ');

  const pathCoordsStr = waypoints
    .map((wp) => `${wp.lon},${wp.lat},${wp.heightM.toFixed(1)}`)
    .join(' ');

  const waypointsPlacemarks = waypoints
    .map(
      (wp) => `
    <Placemark>
      <name>WP ${wp.index}</name>
      <description><![CDATA[
        <b>Waypoint #${wp.index}</b><br/>
        Altura: ${wp.heightM.toFixed(1)} m<br/>
        Rumbo: ${wp.heading}°<br/>
        Gimbal Pitch: ${wp.gimbalPitch}°<br/>
        Velocidad: ${wp.speedMs.toFixed(1)} m/s<br/>
        Acción: ${wp.action === 'photo' ? 'Disparo Foto' : 'Paso directo'}
      ]]></description>
      <Point>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${wp.lon},${wp.lat},${wp.heightM.toFixed(1)}</coordinates>
      </Point>
    </Placemark>`
    )
    .join('\n');

  const takeoffPlacemark = takeoff
    ? `
    <Placemark>
      <name>Punto de Despegue (Home)</name>
      <Point>
        <coordinates>${takeoff.lon},${takeoff.lat},0</coordinates>
      </Point>
    </Placemark>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name || 'Misión SkyGrid'}</name>
    <description><![CDATA[
      Plan de Vuelo Fotogramétrico generado con SkyGrid Planner.<br/>
      Dron: ${settings.droneId}<br/>
      GSD: ${settings.gsdCm.toFixed(2)} cm/px<br/>
      Altura: ${settings.heightM.toFixed(1)} m<br/>
      Velocidad: ${settings.speedMs.toFixed(1)} m/s<br/>
      Distancia Total: ${(metrics.totalDistanceM / 1000).toFixed(2)} km<br/>
      Fotos estimadas: ${metrics.photoCount}
    ]]></description>
    <Style id="polyStyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>3300ffff</color>
      </PolyStyle>
    </Style>
    <Style id="pathStyle">
      <LineStyle>
        <color>ff30c4f4</color>
        <width>3</width>
      </LineStyle>
    </Style>
    <Folder>
      <name>Área de Estudio</name>
      <Placemark>
        <name>Polígono Fotogramétrico</name>
        <styleUrl>#polyStyle</styleUrl>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${polyCoordsStr}</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Folder>
    <Folder>
      <name>Líneas de Vuelo</name>
      <Placemark>
        <name>Trayectoria 3D</name>
        <styleUrl>#pathStyle</styleUrl>
        <LineString>
          <extrude>1</extrude>
          <tessellate>1</tessellate>
          <altitudeMode>relativeToGround</altitudeMode>
          <coordinates>${pathCoordsStr}</coordinates>
        </LineString>
      </Placemark>
    </Folder>
    <Folder>
      <name>Puntos de Misión (Waypoints)</name>
      ${takeoffPlacemark}
      ${waypointsPlacemarks}
    </Folder>
  </Document>
</kml>`;
}

/**
 * Generates DJI Official WPML (Waypoint Markup Language)
 * Compatible with DJI Fly (Mini 4 Pro, Air 3, Mavic 3) and DJI Pilot 2
 */
export function generateDjiWpml(plan: FlightPlan): { templateKml: string; waylinesWpml: string } {
  const { waypoints, settings, metrics, name } = plan;

  const waypointsWpml = waypoints
    .map(
      (wp) => `
      <Placemark>
        <Point>
          <coordinates>${wp.lon.toFixed(7)},${wp.lat.toFixed(7)}</coordinates>
        </Point>
        <wpml:index>${wp.index - 1}</wpml:index>
        <wpml:executeHeight>${wp.heightM.toFixed(1)}</wpml:executeHeight>
        <wpml:waypointSpeed>${wp.speedMs.toFixed(1)}</wpml:waypointSpeed>
        <wpml:waypointHeadingParam>
          <wpml:waypointHeadingMode>manually</wpml:waypointHeadingMode>
          <wpml:waypointHeadingAngle>${wp.heading}</wpml:waypointHeadingAngle>
        </wpml:waypointHeadingParam>
        <wpml:waypointTurnParam>
          <wpml:waypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:waypointTurnMode>
          <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
        </wpml:waypointTurnParam>
        <wpml:useStraightLine>1</wpml:useStraightLine>
        <wpml:waypointGimbalHeadingParam>
          <wpml:waypointGimbalPitchAngle>${wp.gimbalPitch}</wpml:waypointGimbalPitchAngle>
          <wpml:waypointGimbalYawAngle>${wp.heading}</wpml:waypointGimbalYawAngle>
        </wpml:waypointGimbalHeadingParam>
        ${
          wp.action === 'photo'
            ? `<wpml:actionGroup>
          <wpml:actionGroupId>${wp.index - 1}</wpml:actionGroupId>
          <wpml:actionGroupStartIndex>${wp.index - 1}</wpml:actionGroupStartIndex>
          <wpml:actionGroupEndIndex>${wp.index - 1}</wpml:actionGroupEndIndex>
          <wpml:actionGroupMode>sequence</wpml:actionGroupMode>
          <wpml:actionTrigger>
            <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
          </wpml:actionTrigger>
          <wpml:action>
            <wpml:actionId>0</wpml:actionId>
            <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:fileSuffix>SkyGrid_${wp.index}</wpml:fileSuffix>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:actionActuatorFuncParam>
          </wpml:action>
        </wpml:actionGroup>`
            : ''
        }
      </Placemark>`
    )
    .join('\n');

  const templateKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
  <Document>
    <wpml:author>SkyGrid Planner</wpml:author>
    <wpml:createTime>${Date.now()}</wpml:createTime>
    <wpml:updateTime>${Date.now()}</wpml:updateTime>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>${settings.finishAction === 'rth' ? 'goHome' : 'hover'}</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
      <wpml:globalTransitionalSpeed>${settings.speedMs.toFixed(1)}</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>67</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateType>waypoint</wpml:templateType>
      <wpml:templateId>0</wpml:templateId>
      <wpml:autoFlightSpeed>${settings.speedMs.toFixed(1)}</wpml:autoFlightSpeed>
      <wpml:gimbalPitchMode>usePointSetting</wpml:gimbalPitchMode>
      <wpml:globalHeight>${settings.heightM.toFixed(1)}</wpml:globalHeight>
    </Folder>
  </Document>
</kml>`;

  const waylinesWpml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
  <Document>
    <name>${name || 'Misión SkyGrid'}</name>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>${settings.finishAction === 'rth' ? 'goHome' : 'hover'}</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
      <wpml:globalTransitionalSpeed>${settings.speedMs.toFixed(1)}</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>67</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateId>0</wpml:templateId>
      <wpml:waylineId>0</wpml:waylineId>
      <wpml:distance>${Math.round(metrics.totalDistanceM)}</wpml:distance>
      <wpml:duration>${Math.round(metrics.flightTimeSec)}</wpml:duration>
      <wpml:autoFlightSpeed>${settings.speedMs.toFixed(1)}</wpml:autoFlightSpeed>
      ${waypointsWpml}
    </Folder>
  </Document>
</kml>`;

  return { templateKml, waylinesWpml };
}

/**
 * Creates and downloads a real DJI KMZ package containing the WPML files
 */
export async function downloadDjiWpmlKmz(plan: FlightPlan, filename?: string) {
  const zip = new JSZip();
  const { templateKml, waylinesWpml } = generateDjiWpml(plan);

  const wpmzFolder = zip.folder('wpmz');
  if (wpmzFolder) {
    wpmzFolder.file('template.kml', templateKml);
    wpmzFolder.file('waylines.wpml', waylinesWpml);
  }

  const content = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.google-earth.kmz',
  });

  const outName = filename || `${(plan.name || 'SkyGrid_Mision').replace(/\s+/g, '_')}_WPML.kmz`;
  triggerDownload(content, outName);
}

/**
 * Generates Litchi compatible CSV
 * Formatted specifically for Litchi Mission Hub and Litchi app
 */
export function generateLitchiCsv(plan: FlightPlan): string {
  const headers = [
    'latitude',
    'longitude',
    'altitude(m)',
    'heading(deg)',
    'curvesize(m)',
    'rotationdir',
    'gimbalmode',
    'gimbalpitchangle',
    'actiontype1',
    'actionparam1',
    'actiontype2',
    'actionparam2',
    'actiontype3',
    'actionparam3',
    'actiontype4',
    'actionparam4',
    'actiontype5',
    'actionparam5',
    'actiontype6',
    'actionparam6',
    'actiontype7',
    'actionparam7',
    'actiontype8',
    'actionparam8',
    'actiontype9',
    'actionparam9',
    'actiontype10',
    'actionparam10',
    'actiontype11',
    'actionparam11',
    'actiontype12',
    'actionparam12',
    'actiontype13',
    'actionparam13',
    'actiontype14',
    'actionparam14',
    'actiontype15',
    'actionparam15',
    'altitudemode',
    'speed(m/s)',
    'poi_latitude',
    'poi_longitude',
    'poi_altitude(m)',
    'poi_altitudemode',
    'photo_timeinterval',
    'photo_distinterval',
  ];

  const rows = plan.waypoints.map((wp) => {
    // Action 1: Take Photo is actiontype = 1, param = 0 in Litchi
    const actionType1 = wp.action === 'photo' ? '1' : '-1';
    const actionParam1 = '0';

    return [
      wp.lat.toFixed(7),
      wp.lon.toFixed(7),
      wp.heightM.toFixed(1),
      wp.heading,
      '0.2', // curvesize
      '0',   // rotationdir: clockwise (0)
      '0',   // gimbalmode: disabled (0) or focus (1)
      wp.gimbalPitch,
      actionType1,
      actionParam1,
      '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0',
      '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0', '-1', '0',
      '0', // altitudemode: MSL/Relative
      wp.speedMs.toFixed(1),
      '0', // poi_lat
      '0', // poi_lon
      '0', // poi_alt
      '0', // poi_mode
      plan.settings.captureMode === 'interval'
        ? plan.metrics.recommendedIntervalSec.toFixed(1)
        : '-1',
      '-1',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates GeoJSON representing polygon and waypoints
 */
export function generateGeoJson(plan: FlightPlan): string {
  const polygonCoords = plan.polygon.map((p) => [p.lon, p.lat]);
  if (polygonCoords.length > 0) {
    polygonCoords.push([...polygonCoords[0]]);
  }

  const features: GeoJSON.Feature[] = [];

  if (polygonCoords.length >= 4) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygonCoords],
      },
      properties: {
        type: 'mission_polygon',
        name: plan.name,
        areaM2: plan.metrics.areaM2,
        areaHectares: plan.metrics.areaHectares,
        gsdCm: plan.settings.gsdCm,
        heightM: plan.settings.heightM,
      },
    });
  }

  // Path line
  if (plan.waypoints.length > 1) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: plan.waypoints.map((wp) => [wp.lon, wp.lat, wp.heightM]),
      },
      properties: {
        type: 'flight_path',
        distanceM: plan.metrics.totalDistanceM,
        durationSec: plan.metrics.flightTimeSec,
        speedMs: plan.settings.speedMs,
      },
    });
  }

  // Waypoints
  plan.waypoints.forEach((wp) => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [wp.lon, wp.lat, wp.heightM],
      },
      properties: {
        type: 'waypoint',
        index: wp.index,
        heightM: wp.heightM,
        heading: wp.heading,
        gimbalPitch: wp.gimbalPitch,
        action: wp.action,
      },
    });
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features,
    },
    null,
    2
  );
}

/**
 * Downloads a standard KML / KMZ
 */
export async function downloadStandardKmz(plan: FlightPlan, asKmz: boolean = false) {
  const kml = generateStandardKml(plan);
  const baseName = (plan.name || 'SkyGrid_Mision').replace(/\s+/g, '_');

  if (asKmz) {
    const zip = new JSZip();
    zip.file('doc.kml', kml);
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.google-earth.kmz',
    });
    triggerDownload(blob, `${baseName}.kmz`);
  } else {
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    triggerDownload(blob, `${baseName}.kml`);
  }
}

/**
 * Downloads Litchi CSV
 */
export function downloadLitchiCsv(plan: FlightPlan) {
  const csv = generateLitchiCsv(plan);
  const baseName = (plan.name || 'SkyGrid_Mision').replace(/\s+/g, '_');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${baseName}_Litchi.csv`);
}

/**
 * Downloads GeoJSON
 */
export function downloadGeoJson(plan: FlightPlan) {
  const geojson = generateGeoJson(plan);
  const baseName = (plan.name || 'SkyGrid_Mision').replace(/\s+/g, '_');
  const blob = new Blob([geojson], { type: 'application/geo+json' });
  triggerDownload(blob, `${baseName}.geojson`);
}

/**
 * Downloads Full Project JSON
 */
export function downloadProjectJson(plan: FlightPlan) {
  const jsonStr = JSON.stringify(plan, null, 2);
  const baseName = (plan.name || 'SkyGrid_Mision').replace(/\s+/g, '_');
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, `${baseName}_project.json`);
}
