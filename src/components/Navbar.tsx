import React from 'react';
import {
  Compass,
  Download,
  BookOpen,
  Scale,
  FolderOpen,
  Camera,
  Clock,
  Navigation,
  BatteryCharging,
  Maximize2,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import { DroneSpecs, FlightPlanMetrics } from '../types/drone';
import { formatDistance, formatDuration } from '../utils/photogrammetry';
import { GeodesiaSurLogo } from './GeodesiaSurLogo';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface NavbarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  activeDrone: DroneSpecs;
  metrics: FlightPlanMetrics | null;
  gsdCm: number;
  heightM: number;
  onOpenExport: () => void;
  onOpenGuide: () => void;
  onOpenComparator: () => void;
  onOpenProjects: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  onProjectNameChange,
  activeDrone,
  metrics,
  gsdCm,
  heightM,
  onOpenExport,
  onOpenGuide,
  onOpenComparator,
  onOpenProjects,
  onReset,
}) => {
  return (
    <header className="absolute top-3 left-3 right-3 min-h-[96px] z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-2 flex flex-col justify-between gap-1.5 shadow-2xl">
      {/* Top Banner: GeodesiaSur Terra-Aqua. Topografía & Acuicultura + WhatsApp */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 w-full flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 font-bold tracking-wide select-text flex-wrap">
          <span className="text-sky-400 font-black text-xs sm:text-sm drop-shadow-sm">
            Geodesia<span className="text-cyan-300">Sur</span>
          </span>
          <span className="text-emerald-400 font-black text-xs sm:text-sm drop-shadow-sm">
            Terra-Aqua.
          </span>
          <span className="text-amber-400 font-extrabold text-xs sm:text-sm drop-shadow-sm">
            Topografía &amp; Acuicultura
          </span>
          <span className="text-cyan-400 font-black text-xs sm:text-sm drop-shadow-sm ml-0.5">
            PLAVUF
          </span>
          <span className="text-slate-100 font-extrabold text-xs sm:text-sm drop-shadow-sm">
            Planificador de Vuelo Fotogramétrico
          </span>
        </div>

        {/* Botón de contacto vía WhatsApp */}
        <a
          href="https://wa.me/56982997625?text=Hola%20GeodesiaSur%2C%20quisiera%20solicitar%20informaci%C3%B3n%20sobre%20servicios%20de%20topograf%C3%ADa%20y%20fotogrametr%C3%ADa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 shrink-0"
          title="Contactar vía WhatsApp (+56 9 8299 7625)"
        >
          <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
          <span>WhatsApp: <strong className="font-black">+56982997625</strong></span>
        </a>
      </div>

      {/* Main Bar: Brand, Metrics & Action Controls */}
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        {/* Brand & Project Name */}
        <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col justify-center">
          {/* Logo Attached (GeodesiaSur) - Enlarged */}
          <div className="bg-white rounded-xl px-3 py-1 shadow-md flex items-center border border-white/20 shrink-0 w-fit">
            <GeodesiaSurLogo className="h-9 sm:h-11 md:h-12 w-auto" />
          </div>

          {/* Underneath: Title PLAVUF Planificador de vuelo Fotogrametrico */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-extrabold text-xs tracking-wider text-amber-400 uppercase font-mono">
                PLAVUF
              </span>
              <span className="text-[11px] text-slate-200 font-semibold tracking-normal hidden sm:inline">
                Planificador de vuelo Fotogramétrico
              </span>
            </div>
            <div className="h-3 w-px bg-slate-700 hidden md:block"></div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Nombre del proyecto..."
              className="hidden md:inline-block text-[11px] text-slate-400 hover:text-slate-200 focus:text-amber-300 bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-amber-400 focus:outline-none p-0 max-w-[140px] truncate font-medium"
              title="Haz clic para editar el nombre de la misión"
            />
          </div>
        </div>

        {/* Active Drone Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400 font-medium">Dron:</span>
          <span className="font-semibold text-slate-200">{activeDrone.name}</span>
        </div>
      </div>

      {/* Real-time Quick Metrics Bar */}
      <div className="hidden md:flex items-center gap-2.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">GSD:</span>
          <span className="font-mono font-bold text-amber-300">{gsdCm.toFixed(1)} cm/px</span>
          <span className="text-slate-500 text-[10px]">({heightM.toFixed(0)}m)</span>
        </div>

        <div className="w-px h-3.5 bg-slate-800"></div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Tiempo:</span>
          <span className="font-mono font-bold text-sky-300">
            {metrics ? formatDuration(metrics.flightTimeSec) : '--'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-800"></div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Dist:</span>
          <span className="font-mono font-bold text-emerald-300">
            {metrics ? formatDistance(metrics.totalDistanceM) : '--'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-800"></div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Camera className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Fotos:</span>
          <span className="font-mono font-bold text-purple-300">
            {metrics ? metrics.photoCount : '0'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-800"></div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <BatteryCharging className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-slate-400">Bat:</span>
          <span className="font-mono font-bold text-yellow-300">
            {metrics ? `${metrics.estimatedBatteries} bat.` : '1 bat.'}
          </span>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenComparator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
          title="Comparar sensores y especificaciones de drones"
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Comparar Drones</span>
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
          title="Ver tutorial paso a paso para volar con DJI sin SDK"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Guía DJI</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
          title="Guardar o cargar proyectos"
        >
          <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Proyectos</span>
        </button>

        <button
          onClick={onReset}
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all"
          title="Reiniciar plan y limpiar mapa"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Plan</span>
        </button>
      </div>
    </div>
  </header>
  );
};
