import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sliders,
  Camera,
  Compass,
  Upload,
  Sparkles,
  Info,
  ChevronLeft,
  Settings2,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  CameraMode,
  DroneSpecs,
  FlightPattern,
  FlightSettings,
  LatLon,
} from '../types/drone';
import { DRONE_CATALOG, findCameraMode, findDrone } from '../data/drones';
import {
  calcGsdFromHeight,
  calcHeightFromGsd,
  formatArea,
  formatDistance,
  formatDuration,
} from '../utils/photogrammetry';
import { parsePolygonFile } from '../utils/importer';

interface FlightConfigSidebarProps {
  settings: FlightSettings;
  onSettingsChange: (settings: FlightSettings) => void;
  activeDrone: DroneSpecs;
  onDroneChange: (drone: DroneSpecs, mode: CameraMode) => void;
  activeCameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  onPolygonImported: (polygon: LatLon[]) => void;
  optimalOrientation: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FlightConfigSidebar: React.FC<FlightConfigSidebarProps> = ({
  settings,
  onSettingsChange,
  activeDrone,
  onDroneChange,
  activeCameraMode,
  onCameraModeChange,
  onPolygonImported,
  optimalOrientation,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Accordion state
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    drone: true,
    flightParams: true,
    pattern: false,
    capture: false,
    import: false,
  });

  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handlers for bidirectional GSD <-> Height sync
  const handleGsdChange = (newGsd: number) => {
    const clampedGsd = Math.max(0.2, parseFloat(newGsd.toFixed(2)));
    const calculatedHeight = calcHeightFromGsd(clampedGsd, activeCameraMode);
    onSettingsChange({
      ...settings,
      gsdCm: clampedGsd,
      heightM: Math.max(5, parseFloat(calculatedHeight.toFixed(1))),
    });
  };

  const handleHeightChange = (newHeight: number) => {
    const clampedHeight = Math.max(5, parseFloat(newHeight.toFixed(1)));
    const calculatedGsd = calcGsdFromHeight(clampedHeight, activeCameraMode);
    onSettingsChange({
      ...settings,
      heightM: clampedHeight,
      gsdCm: Math.max(0.1, parseFloat(calculatedGsd.toFixed(2))),
    });
  };

  const stepGsd = (delta: number) => {
    handleGsdChange(settings.gsdCm + delta);
  };

  const stepHeight = (delta: number) => {
    handleHeightChange(settings.heightM + delta);
  };

  const stepSpeed = (delta: number) => {
    const nextSpeed = Math.max(1, Math.min(activeDrone.maxSpeedMs, settings.speedMs + delta));
    onSettingsChange({ ...settings, speedMs: parseFloat(nextSpeed.toFixed(1)) });
  };

  // Handle Drone Selection
  const handleDroneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const drone = findDrone(e.target.value);
    const defaultMode = drone.modes[0];
    onDroneChange(drone, defaultMode);
    // Recalculate GSD from current height with the new camera
    const nextGsd = calcGsdFromHeight(settings.heightM, defaultMode);
    onSettingsChange({
      ...settings,
      droneId: drone.id,
      droneModeKey: defaultMode.key,
      gsdCm: Math.max(0.1, parseFloat(nextGsd.toFixed(2))),
    });
  };

  // Handle Camera Mode Selection
  const handleModeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = findCameraMode(activeDrone, e.target.value);
    onCameraModeChange(mode);
    const nextGsd = calcGsdFromHeight(settings.heightM, mode);
    onSettingsChange({
      ...settings,
      droneModeKey: mode.key,
      gsdCm: Math.max(0.1, parseFloat(nextGsd.toFixed(2))),
    });
  };

  // Apply Optimal Angle
  const handleApplyOptimalAngle = () => {
    onSettingsChange({
      ...settings,
      orientationAngle: optimalOrientation,
      orientationMode: 'auto',
    });
  };

  // Handle file import
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);
    try {
      const polygonCoords = await parsePolygonFile(file);
      onPolygonImported(polygonCoords);
    } catch (err: any) {
      setImportError(err.message || 'Error al procesar el archivo');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      {/* Sidebar Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`absolute top-[120px] z-[1000] p-2 rounded-r-xl bg-slate-900/90 backdrop-blur-md border border-l-0 border-slate-700 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center ${
          isCollapsed ? 'left-0' : 'left-[360px] sm:left-[390px]'
        }`}
        title={isCollapsed ? 'Mostrar panel lateral' : 'Ocultar panel lateral'}
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Main Sidebar Container */}
      <aside
        className={`absolute top-[120px] bottom-4 left-3 w-[350px] sm:w-[380px] z-[990] flex flex-col bg-slate-900/92 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
          isCollapsed ? '-translate-x-[110%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                Configuración de Misión
              </h2>
              <p className="text-[10px] text-slate-400">Parámetros fotogramétricos para DJI</p>
            </div>
          </div>
        </div>

        {/* Scrollable Accordion Panels */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* SECTION 1: DRON & SENSOR */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
            <button
              onClick={() => toggleSection('drone')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Dron & Sensor
                </span>
              </div>
              {openSections.drone ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.drone && (
              <div className="p-3.5 pt-1 space-y-3 border-t border-slate-800/60">
                {/* Drone Model Dropdown */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Modelo de Dron DJI
                  </label>
                  <select
                    value={activeDrone.id}
                    onChange={handleDroneSelect}
                    className="w-full h-9 px-3 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:border-amber-400 focus:outline-none"
                  >
                    {DRONE_CATALOG.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {!d.hasSdk ? '(Sin SDK)' : ''}
                      </option>
                    ))}
                  </select>
                  {activeDrone.notes && (
                    <p className="text-[10px] text-amber-300/80 mt-1 flex items-start gap-1">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{activeDrone.notes}</span>
                    </p>
                  )}
                </div>

                {/* Camera Mode / Resolution */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Modo / Resolución de Cámara
                  </label>
                  <select
                    value={activeCameraMode.key}
                    onChange={handleModeSelect}
                    className="w-full h-9 px-3 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:border-amber-400 focus:outline-none"
                  >
                    {activeDrone.modes.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sensor Specifications Badge */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Sensor (Ancho × Alto):</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {activeCameraMode.sensorW} × {activeCameraMode.sensorH} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Focal Real (f):</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {activeCameraMode.f} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Resolución Px:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {activeCameraMode.resW} × {activeCameraMode.resH}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Obturador:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {activeDrone.shutterType}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PARÁMETROS DE VUELO & GSD */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
            <button
              onClick={() => toggleSection('flightParams')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Parámetros Fotogramétricos
                </span>
              </div>
              {openSections.flightParams ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.flightParams && (
              <div className="p-3.5 pt-1 space-y-3.5 border-t border-slate-800/60">
                {/* GSD (Ground Sampling Distance) with Steppers */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <span>GSD Objetivo (cm/px)</span>
                      <span className="text-[10px] text-amber-400 font-normal">
                        (Detalle del terreno)
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => stepGsd(-1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="-1 cm/px"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => stepGsd(-0.1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="-0.1 cm/px"
                    >
                      -0.1
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="30"
                      value={settings.gsdCm}
                      onChange={(e) => handleGsdChange(parseFloat(e.target.value) || 2.5)}
                      className="flex-1 h-8 px-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-center font-mono font-bold text-amber-300 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => stepGsd(0.1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="+0.1 cm/px"
                    >
                      +0.1
                    </button>
                    <button
                      onClick={() => stepGsd(1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="+1 cm/px"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Altura de Vuelo (m) with Steppers (Bidirectional with GSD) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Altura de Vuelo (m AGL/Relativa)
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => stepHeight(-10)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="-10 metros"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => stepHeight(-1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="-1 metro"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="500"
                      value={Math.round(settings.heightM)}
                      onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 80)}
                      className="flex-1 h-8 px-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-center font-mono font-bold text-sky-300 text-sm focus:border-sky-400 focus:outline-none"
                    />
                    <button
                      onClick={() => stepHeight(1)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="+1 metro"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => stepHeight(10)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                      title="+10 metros"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Velocidad de Vuelo (m/s & km/h) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Velocidad de Vuelo
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {(settings.speedMs * 3.6).toFixed(1)} km/h
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => stepSpeed(-1)}
                      className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => stepSpeed(-0.5)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                    >
                      -0.5
                    </button>
                    <div className="flex-1 h-8 px-2 bg-slate-800/90 border border-slate-700 rounded-lg flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                      {settings.speedMs.toFixed(1)} m/s
                    </div>
                    <button
                      onClick={() => stepSpeed(0.5)}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                    >
                      +0.5
                    </button>
                    <button
                      onClick={() => stepSpeed(1)}
                      className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Overlaps: Frontal (Overlap) & Lateral (Sidelap) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Front Overlap */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase">
                        Traslape Frontal
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {settings.frontOverlap}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="1"
                      value={settings.frontOverlap}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, frontOverlap: parseInt(e.target.value) })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => onSettingsChange({ ...settings, frontOverlap: 75 })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                      >
                        75% (2D)
                      </button>
                      <button
                        onClick={() => onSettingsChange({ ...settings, frontOverlap: 80 })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                      >
                        80% (3D)
                      </button>
                    </div>
                  </div>

                  {/* Side Overlap */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-300 uppercase">
                        Traslape Lateral
                      </label>
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {settings.sideOverlap}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="85"
                      step="1"
                      value={settings.sideOverlap}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, sideOverlap: parseInt(e.target.value) })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => onSettingsChange({ ...settings, sideOverlap: 65 })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                      >
                        65% (2D)
                      </button>
                      <button
                        onClick={() => onSettingsChange({ ...settings, sideOverlap: 70 })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                      >
                        70% (3D)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Margen de Seguridad (Buffer) & Inclinación Gimbal */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Margen Buffer (m)
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="-50"
                      max="100"
                      value={settings.bufferM}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, bufferM: parseInt(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs font-mono text-center text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Gimbal Pitch (°)
                    </label>
                    <select
                      value={settings.gimbalPitch}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, gimbalPitch: parseInt(e.target.value) })
                      }
                      className="w-full h-8 px-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
                    >
                      <option value="-90">-90° (Nadir Puro)</option>
                      <option value="-75">-75° (Oblicuo Ligero)</option>
                      <option value="-60">-60° (Oblicuo 3D)</option>
                      <option value="-45">-45° (Fachadas)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: TRAYECTORIA, ORIENTACIÓN Y PATRÓN */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
            <button
              onClick={() => toggleSection('pattern')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Patrón & Orientación
                </span>
              </div>
              {openSections.pattern ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.pattern && (
              <div className="p-3.5 pt-1 space-y-3.5 border-t border-slate-800/60">
                {/* Pattern Type Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Patrón de Barrido
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSettingsChange({ ...settings, pattern: 'grid' })}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        settings.pattern === 'grid'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Rejilla Simple</span>
                      <span className="text-[10px] text-slate-500 font-normal">1 Dirección</span>
                    </button>

                    <button
                      onClick={() => onSettingsChange({ ...settings, pattern: 'double_grid' })}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        settings.pattern === 'double_grid'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Doble Rejilla</span>
                      <span className="text-[10px] text-slate-500 font-normal">Cruce a 90° (3D)</span>
                    </button>
                  </div>
                </div>

                {/* Grid Orientation Slider & Auto Optimal Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ángulo de Líneas:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {Math.round(settings.orientationAngle)}°
                      </span>
                      {settings.orientationMode === 'auto' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          Óptimo
                        </span>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={settings.orientationAngle}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        orientationAngle: parseInt(e.target.value),
                        orientationMode: 'manual',
                      })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Apply Optimal Orientation button */}
                  <button
                    onClick={handleApplyOptimalAngle}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Calcular Orientación Óptima Automática ({optimalOrientation}°)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: MODO DE DISPARO (DJI SIN SDK) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
            <button
              onClick={() => toggleSection('capture')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Modo de Captura DJI
                </span>
              </div>
              {openSections.capture ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.capture && (
              <div className="p-3.5 pt-1 space-y-3.5 border-t border-slate-800/60">
                {/* Capture Mode */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Método de Disparo
                  </label>
                  <select
                    value={settings.captureMode}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        captureMode: e.target.value as any,
                      })
                    }
                    className="w-full h-9 px-3 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:border-amber-400 focus:outline-none"
                  >
                    <option value="waypoint">
                      Acción en Waypoint (DJI Fly Waypoints / M3, Mini 4 Pro, Air 3)
                    </option>
                    <option value="interval">
                      Disparo por Intervalo (Mini 2, Mini 3, Air 2S sin SDK)
                    </option>
                  </select>
                </div>

                {/* Interval Notice */}
                {settings.captureMode === 'interval' && (
                  <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200">
                    <p className="font-semibold text-purple-300 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Recomendación de Intervalo:
                    </p>
                    <p className="mt-1 text-[11px] text-purple-300/80">
                      Configura en tu mando DJI el modo de foto en{' '}
                      <strong className="text-white">
                        Intervalo cada 2 o 3 segundos
                      </strong>{' '}
                      antes de iniciar la misión.
                    </p>
                  </div>
                )}

                {/* Finish Action */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Acción al Finalizar Misión
                  </label>
                  <select
                    value={settings.finishAction}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        finishAction: e.target.value as any,
                      })
                    }
                    className="w-full h-8 px-3 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:outline-none"
                  >
                    <option value="rth">Regresar al Despegue (RTH Seguro)</option>
                    <option value="hover">Quedarse Suspendido (Hover)</option>
                    <option value="land">Aterrizar en el último punto</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: IMPORTAR ÁREA DESDE GOOGLE EARTH (KML / KMZ) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
            <button
              onClick={() => toggleSection('import')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Importar Área (KML / KMZ)
                </span>
              </div>
              {openSections.import ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.import && (
              <div className="p-3.5 pt-1 space-y-3 border-t border-slate-800/60">
                <p className="text-[11px] text-slate-400">
                  Carga un archivo de Google Earth o SIG con el polígono del proyecto (.kml, .kmz o .geojson):
                </p>

                <label className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-amber-400 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{importLoading ? 'Cargando...' : 'Seleccionar KML / KMZ'}</span>
                  <input
                    type="file"
                    accept=".kml,.kmz,.geojson,.json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>

                {importError && (
                  <p className="text-[11px] text-red-400 bg-red-950/60 p-2 rounded-lg border border-red-900">
                    {importError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
