import React, { useState } from 'react';
import { X, Scale, Camera, Maximize2, Clock, BatteryCharging, Zap } from 'lucide-react';
import { DRONE_CATALOG } from '../data/drones';
import {
  calcGsdFromHeight,
  calcHeightFromGsd,
  computeFootprint,
  calcRouteSpacing,
  calcWaypointSpacing,
  formatDuration,
} from '../utils/photogrammetry';

interface DroneComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DroneComparatorModal: React.FC<DroneComparatorModalProps> = ({ isOpen, onClose }) => {
  const [selectedDroneIds, setSelectedDroneIds] = useState<string[]>([
    'dji-mini-4-pro',
    'dji-air-3',
    'dji-mavic-3-classic',
  ]);

  const [compareMode, setCompareMode] = useState<'fixed_height' | 'target_gsd'>('fixed_height');
  const [benchmarkHeight, setBenchmarkHeight] = useState<number>(80);
  const [targetGsd, setTargetGsd] = useState<number>(2.0);

  if (!isOpen) return null;

  const drones = selectedDroneIds
    .map((id) => DRONE_CATALOG.find((d) => d.id === id))
    .filter(Boolean);

  const benchmarkHectares = 10;
  const benchmarkAreaM2 = benchmarkHectares * 10000; // 100,000 m²

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Comparador de Drones Fotogramétricos
              </h2>
              <p className="text-xs text-slate-400">
                Rendimiento de sensores, resolución y cobertura en levantamientos reales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benchmark Control Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase text-[11px]">
              Criterio de Comparación:
            </span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setCompareMode('fixed_height')}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  compareMode === 'fixed_height'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Misma Altura ({benchmarkHeight}m)
              </button>
              <button
                onClick={() => setCompareMode('target_gsd')}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  compareMode === 'target_gsd'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mismo GSD ({targetGsd} cm/px)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compareMode === 'fixed_height' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Altura:</span>
                <input
                  type="number"
                  step="5"
                  min="20"
                  max="200"
                  value={benchmarkHeight}
                  onChange={(e) => setBenchmarkHeight(parseInt(e.target.value) || 80)}
                  className="w-16 h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-center font-mono font-bold text-sky-400"
                />
                <span className="text-slate-500">m</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">GSD Objetivo:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  value={targetGsd}
                  onChange={(e) => setTargetGsd(parseFloat(e.target.value) || 2.0)}
                  className="w-16 h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-center font-mono font-bold text-amber-400"
                />
                <span className="text-slate-500">cm/px</span>
              </div>
            )}
            <span className="text-[11px] text-slate-500">| Parcela Ref: 10 ha (75/65% traslape)</span>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drones.map((drone, idx) => {
              if (!drone) return null;
              const cam = drone.modes[0];

              // Computations
              let flightHeightM = benchmarkHeight;
              let gsdCm = 0;

              if (compareMode === 'fixed_height') {
                gsdCm = calcGsdFromHeight(benchmarkHeight, cam);
              } else {
                gsdCm = targetGsd;
                flightHeightM = calcHeightFromGsd(targetGsd, cam);
              }

              const footprint = computeFootprint(flightHeightM, cam);
              const routeSpacingM = calcRouteSpacing(footprint.groundWidthM, 65);
              const wpSpacingM = calcWaypointSpacing(footprint.groundHeightM, 75);

              // Benchmark 10 hectares calculation (approx 316m x 316m square)
              const squareSideM = Math.sqrt(benchmarkAreaM2);
              const numLines = Math.max(1, Math.ceil(squareSideM / routeSpacingM));
              const photosPerLine = Math.max(1, Math.ceil(squareSideM / wpSpacingM));
              const totalPhotos = numLines * photosPerLine;

              const totalDistanceM = numLines * squareSideM + (numLines - 1) * routeSpacingM;
              const flightTimeSec = totalDistanceM / 5.0; // at 5 m/s
              const safeBatterySec = drone.batteryTimeMinutes * 60 * 0.75;
              const batteriesNeeded = Math.max(1, Math.ceil(flightTimeSec / safeBatterySec));

              return (
                <div
                  key={drone.id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex flex-col justify-between hover:border-amber-500/50 transition-all space-y-4"
                >
                  {/* Drone Header & Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Opción #{idx + 1}
                      </span>
                      {drone.supportedInDjiFlyWaypoints ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          DJI Fly Waypoints
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          Disparo Intervalo
                        </span>
                      )}
                    </div>

                    <select
                      value={drone.id}
                      onChange={(e) => {
                        const next = [...selectedDroneIds];
                        next[idx] = e.target.value;
                        setSelectedDroneIds(next);
                      }}
                      className="w-full h-9 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:border-amber-400 focus:outline-none"
                    >
                      {DRONE_CATALOG.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{cam.label}</p>
                  </div>

                  {/* Core Metrics */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">GSD Resultante:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {gsdCm.toFixed(2)} cm/px
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Altura de Vuelo:</span>
                      <span className="font-mono font-bold text-sky-400 text-sm">
                        {flightHeightM.toFixed(1)} m
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Huella por Foto:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {footprint.groundWidthM.toFixed(0)}m × {footprint.groundHeightM.toFixed(0)}m
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Cobertura/Disparo:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {Math.round(footprint.areaM2).toLocaleString('es-ES')} m²
                      </span>
                    </div>
                  </div>

                  {/* Benchmark 10ha Performance Box */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Rendimiento para 10 Hectáreas</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Total Fotos:</span>
                      <span className="font-mono font-bold text-purple-400">{totalPhotos}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Tiempo Estimado:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {formatDuration(flightTimeSec)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Baterías Requeridas:</span>
                      <span className="font-mono font-bold text-yellow-400">
                        {batteriesNeeded} {batteriesNeeded === 1 ? 'batería' : 'baterías'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Cerrar Comparador
          </button>
        </div>
      </div>
    </div>
  );
};
