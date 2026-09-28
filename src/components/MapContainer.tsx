import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import {
  Layers,
  MapPin,
  Pencil,
  Trash2,
  Crosshair,
  Search,
  Maximize,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { LatLon, WaypointItem } from '../types/drone';
import { formatDistance } from '../utils/photogrammetry';

interface MapContainerProps {
  takeoff: LatLon | null;
  onTakeoffChange: (pos: LatLon | null) => void;
  polygon: LatLon[];
  onPolygonChange: (poly: LatLon[]) => void;
  waypoints: WaypointItem[];
  flightHeightM: number;
  footprintWidthM: number;
  footprintHeightM: number;
  activeTool: 'none' | 'takeoff' | 'draw';
  onActiveToolChange: (tool: 'none' | 'takeoff' | 'draw') => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  takeoff,
  onTakeoffChange,
  polygon,
  onPolygonChange,
  waypoints,
  footprintWidthM,
  footprintHeightM,
  activeTool,
  onActiveToolChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const takeoffLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);
  const flightPathLayerRef = useRef<L.LayerGroup | null>(null);
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null);
  const footprintLayerRef = useRef<L.LayerGroup | null>(null);

  // States
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showFootprint, setShowFootprint] = useState(true);
  const [showHelpToast, setShowHelpToast] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center (Madrid / Spain or global pleasant aerial terrain)
    const map = L.map(mapContainerRef.current, {
      center: [40.4168, -3.7038],
      zoom: 17,
      zoomControl: false,
    });

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Satellite Tile Layer (ESRI World Imagery)
    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = satLayer;

    // Init layer groups
    takeoffLayerRef.current = L.layerGroup().addTo(map);
    polygonLayerRef.current = L.layerGroup().addTo(map);
    flightPathLayerRef.current = L.layerGroup().addTo(map);
    waypointsLayerRef.current = L.layerGroup().addTo(map);
    footprintLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Map Layer (Satellite vs Street)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
    }
  }, [mapType]);

  // Click handler on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (activeTool === 'takeoff') {
        onTakeoffChange({ lat: e.latlng.lat, lon: e.latlng.lng });
        onActiveToolChange('none');
      } else if (activeTool === 'draw') {
        // Add point to polygon
        onPolygonChange([...polygon, { lat: e.latlng.lat, lon: e.latlng.lng }]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [activeTool, onTakeoffChange, onActiveToolChange, polygon, onPolygonChange]);

  // Render Takeoff Marker
  useEffect(() => {
    const layer = takeoffLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (takeoff) {
      const icon = L.divIcon({
        className: 'custom-takeoff-icon',
        html: `<div class="takeoff-marker" title="Punto de Despegue (Home)">✈</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([takeoff.lat, takeoff.lon], {
        icon,
        draggable: true,
      });

      marker.bindTooltip('<b>PUNTO DE DESPEGUE (HOME)</b><br/>Arrastra para reubicar', {
        direction: 'top',
        className: 'bg-slate-900 text-amber-300 text-xs border border-amber-500/40 rounded px-2 py-1',
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onTakeoffChange({ lat: pos.lat, lon: pos.lng });
      });

      layer.addLayer(marker);
    }
  }, [takeoff, onTakeoffChange]);

  // Render Polygon & Interactive Vertices
  useEffect(() => {
    const layer = polygonLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    if (polygon.length >= 2) {
      const latlngs = polygon.map((p) => [p.lat, p.lon] as [number, number]);

      if (polygon.length >= 3) {
        // Closed polygon
        const polyline = L.polygon(latlngs, {
          color: '#38bdf8',
          weight: 2.5,
          fillColor: '#0284c7',
          fillOpacity: 0.18,
          dashArray: activeTool === 'draw' ? '6 6' : undefined,
        });
        layer.addLayer(polyline);

        // Segment length labels & midpoint adders
        for (let i = 0; i < polygon.length; i++) {
          const p1 = polygon[i];
          const p2 = polygon[(i + 1) % polygon.length];
          const midLat = (p1.lat + p2.lat) / 2;
          const midLon = (p1.lon + p2.lon) / 2;

          // Distance
          const distM = turf.distance([p1.lon, p1.lat], [p2.lon, p2.lat], { units: 'kilometers' }) * 1000;
          const labelIcon = L.divIcon({
            className: 'custom-segment-label',
            html: `<div class="segment-label">${formatDistance(distM)}</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10],
          });
          layer.addLayer(L.marker([midLat, midLon], { icon: labelIcon, interactive: false }));

          // Midpoint (+) adder
          if (activeTool !== 'draw') {
            const plusIcon = L.divIcon({
              className: 'custom-midpoint-icon',
              html: `<div class="midpoint-marker" title="Haz clic para agregar un vértice aquí">+</div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            const midMarker = L.marker([midLat, midLon], { icon: plusIcon });
            midMarker.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              const newPoints = [...polygon];
              newPoints.splice(i + 1, 0, { lat: midLat, lon: midLon });
              onPolygonChange(newPoints);
            });
            layer.addLayer(midMarker);
          }
        }
      } else {
        // Open polyline while drawing first points
        const line = L.polyline(latlngs, {
          color: '#38bdf8',
          weight: 2,
          dashArray: '4 4',
        });
        layer.addLayer(line);
      }

      // Vertex markers
      polygon.forEach((pt, idx) => {
        const isFirst = idx === 0 && activeTool === 'draw';
        const vertexIcon = L.divIcon({
          className: 'custom-vertex-icon',
          html: isFirst
            ? `<div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-slate-950 font-black cursor-pointer shadow-lg animate-bounce" title="Haz clic para cerrar el polígono">✓</div>`
            : `<div class="vertex-marker" title="Vértice #${idx + 1}. Arrastra o doble-clic para eliminar"></div>`,
          iconSize: isFirst ? [20, 20] : [14, 14],
          iconAnchor: isFirst ? [10, 10] : [7, 7],
        });

        const vMarker = L.marker([pt.lat, pt.lon], {
          icon: vertexIcon,
          draggable: activeTool !== 'draw',
        });

        // Close polygon on clicking first point while drawing
        if (isFirst) {
          vMarker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (polygon.length >= 3) {
              onActiveToolChange('none');
            }
          });
        }

        // Drag vertex
        vMarker.on('drag', () => {
          const pos = vMarker.getLatLng();
          const nextPoints = [...polygon];
          nextPoints[idx] = { lat: pos.lat, lon: pos.lng };
          onPolygonChange(nextPoints);
        });

        // Double-click to delete vertex
        vMarker.on('dblclick', (e) => {
          L.DomEvent.stopPropagation(e);
          if (polygon.length > 3) {
            const nextPoints = polygon.filter((_, i) => i !== idx);
            onPolygonChange(nextPoints);
          }
        });

        layer.addLayer(vMarker);
      });
    }
  }, [polygon, activeTool, onPolygonChange, onActiveToolChange]);

  // Render Flight Path & Waypoints
  useEffect(() => {
    const pathLayer = flightPathLayerRef.current;
    const wpLayer = waypointsLayerRef.current;
    const fpLayer = footprintLayerRef.current;
    if (!pathLayer || !wpLayer || !fpLayer) return;

    pathLayer.clearLayers();
    wpLayer.clearLayers();
    fpLayer.clearLayers();

    if (waypoints.length > 1) {
      // Connecting path
      const coords = waypoints.map((w) => [w.lat, w.lon] as [number, number]);

      // Connect takeoff to first waypoint if exists
      if (takeoff) {
        const leadIn = L.polyline(
          [
            [takeoff.lat, takeoff.lon],
            [waypoints[0].lat, waypoints[0].lon],
          ],
          {
            color: '#10b981',
            weight: 2,
            dashArray: '5 5',
          }
        );
        leadIn.bindTooltip('Aproximación inicial de vuelo', { direction: 'center' });
        pathLayer.addLayer(leadIn);
      }

      // Main photogrammetric grid path
      const mainPath = L.polyline(coords, {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.9,
      });
      pathLayer.addLayer(mainPath);

      // Waypoints
      waypoints.forEach((wp) => {
        const wpColor = wp.action === 'photo' ? '#fbbf24' : '#38bdf8';
        const wpIcon = L.divIcon({
          className: 'custom-wp-icon',
          html: `<div class="wp-marker" style="background:${wpColor}">${wp.index}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([wp.lat, wp.lon], { icon: wpIcon });
        marker.bindTooltip(
          `<div class="p-1 font-sans">
            <b class="text-amber-400">Waypoint #${wp.index}</b><br/>
            <span>Altura: <b>${wp.heightM.toFixed(1)} m</b></span><br/>
            <span>Rumbo: <b>${wp.heading}°</b></span><br/>
            <span>Acción: <b>${wp.action === 'photo' ? 'Disparo Foto 📷' : 'Tránsito'}</b></span>
          </div>`,
          { direction: 'top', className: 'bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-xs' }
        );

        wpLayer.addLayer(marker);
      });

      // Camera footprint preview at midpoint waypoint
      if (showFootprint && footprintWidthM > 0 && footprintHeightM > 0 && waypoints.length > 0) {
        const midWp = waypoints[Math.floor(waypoints.length / 2)];
        const center = turf.point([midWp.lon, midWp.lat]);

        // Create footprint rectangle
        const halfW = footprintWidthM / 2000; // km
        const halfH = footprintHeightM / 2000; // km

        const bbox: [number, number, number, number] = [
          midWp.lon - (halfW / (111.32 * Math.cos((midWp.lat * Math.PI) / 180))),
          midWp.lat - halfH / 110.574,
          midWp.lon + (halfW / (111.32 * Math.cos((midWp.lat * Math.PI) / 180))),
          midWp.lat + halfH / 110.574,
        ];

        const fpPoly = turf.bboxPolygon(bbox);
        const rotatedFp = turf.transformRotate(fpPoly, midWp.heading, { pivot: center });

        const fpCoords = rotatedFp.geometry.coordinates[0].map(
          (c) => [c[1], c[0]] as [number, number]
        );

        const footprintRect = L.polygon(fpCoords, {
          color: '#ec4899',
          weight: 2,
          fillColor: '#f43f5e',
          fillOpacity: 0.22,
          dashArray: '3 3',
        });

        footprintRect.bindTooltip(
          `<div class="p-1">
            <b class="text-pink-400">Huella de Foto Individual</b><br/>
            Dimensiones: <b>${footprintWidthM.toFixed(1)}m × ${footprintHeightM.toFixed(1)}m</b><br/>
            Cobertura por disparo: <b>${(footprintWidthM * footprintHeightM).toFixed(0)} m²</b>
          </div>`,
          { direction: 'center', className: 'bg-slate-900 text-slate-100 border border-pink-500/40 rounded-lg text-xs' }
        );

        fpLayer.addLayer(footprintRect);
      }
    }
  }, [waypoints, takeoff, showFootprint, footprintWidthM, footprintHeightM]);

  // Fit bounds to mission
  const handleZoomToMission = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([]);
    if (takeoff) bounds.extend([takeoff.lat, takeoff.lon]);
    polygon.forEach((p) => bounds.extend([p.lat, p.lon]));
    waypoints.forEach((w) => bounds.extend([w.lat, w.lon]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18 });
    }
  }, [takeoff, polygon, waypoints]);

  // Fit bounds when polygon is loaded / changed externally
  useEffect(() => {
    if (polygon.length >= 3 && waypoints.length > 0) {
      handleZoomToMission();
    }
  }, [polygon.length > 0]); // only on significant load

  // Geocoding / Location Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    setSearchError(null);

    // Check if query is lat,lon coordinates
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        mapInstanceRef.current.flyTo([lat, lon], 17);
        setIsSearching(false);
        return;
      }
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        mapInstanceRef.current.flyTo([lat, lon], 17);
      } else {
        setSearchError('No se encontró la ubicación. Prueba con otra búsqueda o coordenadas.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error al buscar la ubicación.');
    } finally {
      setIsSearching(false);
    }
  };

  // Center on User GPS Location
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* The Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Floating Search Bar */}
      <div className="absolute top-[120px] left-4 z-[1000] w-72 sm:w-80">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ciudad, lugar o coordenadas..."
            className="w-full h-10 pl-9 pr-8 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-100 placeholder-slate-400 text-xs rounded-xl shadow-xl focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {isSearching && (
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin absolute right-3 top-3.5"></div>
          )}
        </form>
        {searchError && (
          <div className="mt-1 text-[11px] bg-red-950/90 text-red-300 border border-red-800 rounded-lg px-2.5 py-1 backdrop-blur-md">
            {searchError}
          </div>
        )}
      </div>

      {/* Map Tools Floating Bar (Top Right) */}
      <div className="absolute top-[120px] right-4 z-[1000] flex flex-col gap-2">
        {/* Layer Selector (Sat vs Street) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex shadow-xl">
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mapType === 'satellite'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Vista de satélite de alta resolución"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Satélite</span>
          </button>
          <button
            onClick={() => setMapType('street')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mapType === 'street'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Mapa vectorial de calles"
          >
            <span className="hidden sm:inline">Calles</span>
          </button>
        </div>

        {/* Action Tools */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex flex-col gap-1 shadow-xl">
          {/* Takeoff Point Tool */}
          <button
            onClick={() => onActiveToolChange(activeTool === 'takeoff' ? 'none' : 'takeoff')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTool === 'takeoff'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg ring-2 ring-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Fijar Punto de Despegue (Home) en el mapa"
          >
            <MapPin className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
            <span className="hidden sm:inline text-xs">Punto Despegue</span>
          </button>

          {/* Draw Polygon Tool */}
          <button
            onClick={() => onActiveToolChange(activeTool === 'draw' ? 'none' : 'draw')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTool === 'draw'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-lg ring-2 ring-sky-300 animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Dibujar polígono de área fotogramétrica"
          >
            <Pencil className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline text-xs">Dibujar Área</span>
          </button>

          {/* Toggle Footprint Preview */}
          <button
            onClick={() => setShowFootprint(!showFootprint)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              showFootprint
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Mostrar/ocultar huella de foto en tierra"
          >
            <span className="text-[12px]">📷</span>
            <span className="hidden sm:inline text-xs">Huella Foto</span>
          </button>

          <div className="h-px bg-slate-800 my-0.5"></div>

          {/* Zoom to mission */}
          <button
            onClick={handleZoomToMission}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2"
            title="Centrar mapa en la misión completa"
          >
            <Maximize className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs">Ajustar Vista</span>
          </button>

          {/* GPS Locate Me */}
          <button
            onClick={handleLocateMe}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2"
            title="Ir a mi ubicación GPS actual"
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline text-xs">Mi Ubicación</span>
          </button>

          {/* Clear Polygon */}
          {polygon.length > 0 && (
            <button
              onClick={() => onPolygonChange([])}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
              title="Borrar área delimitada"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Borrar Área</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive Guide Toast / Help Banner */}
      {showHelpToast && (
        <div className="absolute bottom-20 sm:bottom-4 right-4 sm:right-16 z-[1000] max-w-[calc(100vw-2rem)] sm:max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex items-start gap-3">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs text-slate-300">
            {!takeoff ? (
              <p>
                <strong className="text-amber-300">Paso 1:</strong> Haz clic en{' '}
                <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                  <MapPin className="w-3 h-3" /> Punto Despegue
                </span>{' '}
                y marca en el mapa dónde estará el piloto o el home del dron.
              </p>
            ) : polygon.length < 3 ? (
              <p>
                <strong className="text-sky-300">Paso 2:</strong> Haz clic en{' '}
                <span className="inline-flex items-center gap-1 font-semibold text-sky-400">
                  <Pencil className="w-3 h-3" /> Dibujar Área
                </span>{' '}
                para delimitar la zona de mapeo. Toca el punto inicial para cerrarlo.
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Plan fotogramétrico activo
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Puedes arrastrar los vértices azules, pulsar (+) en un lado para añadir puntos o
                    ajustar la rotación y el GSD en la barra lateral.
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowHelpToast(false)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-0.5"
            title="Cerrar aviso de guía"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
