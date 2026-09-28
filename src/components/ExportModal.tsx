import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  FileText,
  Map,
  Share2,
  CheckCircle2,
  Smartphone,
  HardDrive,
  Copy,
  Info,
} from 'lucide-react';
import { FlightPlan } from '../types/drone';
import {
  downloadDjiWpmlKmz,
  downloadGeoJson,
  downloadLitchiCsv,
  downloadProjectJson,
  downloadStandardKmz,
} from '../utils/exporter';
import { formatArea, formatDistance, formatDuration } from '../utils/photogrammetry';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightPlan: FlightPlan | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, flightPlan }) => {
  const [activeTab, setActiveTab] = useState<'formats' | 'instructions'>('formats');
  const [copiedPath, setCopiedPath] = useState(false);

  if (!isOpen || !flightPlan) return null;

  const { metrics, settings } = flightPlan;

  const djiAndroidPath = 'Android/data/dji.go.v5/files/waypoint';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(djiAndroidPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Exportar Plan de Vuelo Fotogramétrico
              </h2>
              <p className="text-xs text-slate-400">
                Formatos compatibles con drones DJI sin SDK, DJI Fly, Litchi y SIG
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

        {/* Quick Summary Pill Bar */}
        <div className="px-5 py-3 bg-slate-950/30 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">GSD / Altura</span>
            <span className="font-mono font-bold text-amber-400">
              {settings.gsdCm.toFixed(1)} cm/px ({settings.heightM.toFixed(0)}m)
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Duración Est.</span>
            <span className="font-mono font-bold text-sky-400">
              {formatDuration(metrics.flightTimeSec)}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Distancia</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatDistance(metrics.totalDistanceM)}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Fotos</span>
            <span className="font-mono font-bold text-purple-400">
              {metrics.photoCount} fotos
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-4">
          <button
            onClick={() => setActiveTab('formats')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'formats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Formatos de Descarga
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'instructions'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Cómo cargarlo en DJI Fly</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'formats' ? (
            <div className="space-y-3">
              {/* Option 1: DJI WPML (KMZ) - Recommended */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/40 relative overflow-hidden group hover:border-amber-400 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100">
                          DJI WPML (.KMZ)
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                          Recomendado DJI Fly
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Estándar oficial de Waypoints DJI (template.kml + waylines.wpml). Compatible
                        directamente con <strong>DJI Mini 4 Pro, DJI Air 3, Mavic 3</strong> y DJI Pilot 2.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDjiWpmlKmz(flightPlan)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar WPML</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Standard KML / KMZ for Google Earth */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-all flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                    <Map className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Google Earth & SIG (KML / KMZ)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Visualiza el polígono 3D, líneas de vuelo y waypoints en Google Earth Pro,
                      QGIS, ArcGIS o Global Mapper.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadStandardKmz(flightPlan, false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
                  >
                    .KML
                  </button>
                  <button
                    onClick={() => downloadStandardKmz(flightPlan, true)}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    .KMZ
                  </button>
                </div>
              </div>

              {/* Option 3: Litchi CSV */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-all flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">
                        Litchi Mission Hub (.CSV)
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        Mini 2 / Air 2S
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Importación directa en Litchi Mission Hub. Ideal para drones DJI con MSDK o
                      control conectado al smartphone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadLitchiCsv(flightPlan)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  <span>Descargar CSV</span>
                </button>
              </div>

              {/* Option 4: GeoJSON & Project Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">GeoJSON Estándar</h4>
                    <p className="text-[11px] text-slate-500">Para QGIS / Web GIS</p>
                  </div>
                  <button
                    onClick={() => downloadGeoJson(flightPlan)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    .geojson
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Copia de Seguridad (.JSON)</h4>
                    <p className="text-[11px] text-slate-500">Respaldar proyecto completo</p>
                  </div>
                  <button
                    onClick={() => downloadProjectJson(flightPlan)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    .json
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: FIELD INSTRUCTIONS */
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  Ruta en Control DJI RC 2 / Celular Android:
                </p>
                <div className="mt-2 flex items-center justify-between bg-slate-950/80 p-2 rounded-lg font-mono text-[11px] border border-slate-800">
                  <span className="text-amber-300 truncate">{djiAndroidPath}</span>
                  <button
                    onClick={handleCopyPath}
                    className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                  >
                    {copiedPath ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPath ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Descarga el archivo WPML (.KMZ)</h4>
                    <p className="text-slate-400 mt-0.5">
                      Haz clic en "Descargar WPML" para obtener el archivo empaquetado compatible con
                      DJI Fly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Transfiere el archivo al control</h4>
                    <p className="text-slate-400 mt-0.5">
                      Conecta el mando (DJI RC, DJI RC 2 o tu smartphone) a la computadora mediante USB-C o
                      copia el archivo en la tarjeta MicroSD.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Pega el archivo en la carpeta Waypoints</h4>
                    <p className="text-slate-400 mt-0.5">
                      Pega el archivo en la carpeta <code>Android/data/dji.go.v5/files/waypoint/</code>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Abre DJI Fly y ejecuta la misión</h4>
                    <p className="text-slate-400 mt-0.5">
                      Enciende el dron, abre DJI Fly, ve a la sección de Waypoints y verás tu misión con
                      la cuadrícula y altura exactamente planificada. ¡Listo para despegar!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
