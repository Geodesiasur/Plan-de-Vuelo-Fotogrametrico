import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Plane,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface FieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'workflow' | 'drones' | 'topography' | 'checklist'>('workflow');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Guía Completa: Fotogrametría con Drones DJI Sin SDK
              </h2>
              <p className="text-xs text-slate-400">
                Tutorial paso a paso basado en el flujo de trabajo de SkyGrid
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveSection('workflow')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSection === 'workflow'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Flujo de Trabajo
          </button>
          <button
            onClick={() => setActiveSection('drones')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSection === 'drones'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compatibilidad de Drones
          </button>
          <button
            onClick={() => setActiveSection('topography')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSection === 'topography'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Principios Topográficos
          </button>
          <button
            onClick={() => setActiveSection('checklist')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeSection === 'checklist'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Checklist de Campo
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-300">
          {activeSection === 'workflow' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-200">
                <h3 className="font-bold text-sm text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  ¿Por qué no necesitas que DJI libere el SDK?
                </h3>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  Históricamente, los pilotos dependían de aplicaciones de terceros (como DroneDeploy o
                  Pix4Dcapture) que exigían que DJI liberara el SDK móvil (MSDK). Con drones modernos como
                  el <strong>Mini 4 Pro, Air 3 o Mavic 3</strong>, DJI incorporó el motor nativo de Waypoints en la
                  propia app DJI Fly, y en drones sin waypoints (como el <strong>Mini 2 o Mini 3</strong>), se puede
                  ejecutar la ruta con <strong>disparo cronometrado por intervalo</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                      A
                    </span>
                    <h4 className="font-bold text-slate-100">Método 1: DJI Fly Waypoints Nativos</h4>
                  </div>
                  <p className="text-slate-400">
                    Aplica a: <strong>Mini 4 Pro, Air 3, Mavic 3 Series</strong>.
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>Genera el plan en SkyGrid y pulsa "Descargar WPML (.KMZ)".</li>
                    <li>
                      Conecta el mando (DJI RC 2 o celular) a la PC o usa una tarjeta microSD.
                    </li>
                    <li>
                      Pega el archivo en{' '}
                      <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">
                        Android/data/dji.go.v5/files/waypoint/
                      </code>
                    </li>
                    <li>Abre DJI Fly &gt; Waypoints. Tu vuelo aparecerá listo con fotos automáticas.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center">
                      B
                    </span>
                    <h4 className="font-bold text-slate-100">Método 2: Disparo por Intervalo</h4>
                  </div>
                  <p className="text-slate-400">
                    Aplica a: <strong>Mini 2, Mini 3, Mini 4K, Air 2S</strong>.
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>En SkyGrid selecciona "Disparo por Intervalo".</li>
                    <li>
                      SkyGrid calcula el intervalo óptimo en segundos (ej. <strong>2.0s o 2.5s</strong>) según tu velocidad y traslape.
                    </li>
                    <li>Cargas la trayectoria en Litchi Hub (o vuelas siguiendo la cuadrícula).</li>
                    <li>En el control DJI configuras la cámara en modo Foto &gt; Intervalo y ejecutas.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'drones' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-100">
                Resumen de Compatibilidad y Especificaciones
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">Dron</th>
                      <th className="p-2.5">Sensor</th>
                      <th className="p-2.5">Megapíxeles</th>
                      <th className="p-2.5">DJI Fly Waypoints</th>
                      <th className="p-2.5">Método Fotogramétrico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Mini 4 Pro</td>
                      <td className="p-2.5 text-slate-300">1/1.3" CMOS</td>
                      <td className="p-2.5 text-amber-400 font-mono">12MP / 48MP</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">✓ Nativo</td>
                      <td className="p-2.5 text-slate-300">WPML (.KMZ) directo</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Air 3 / 3S</td>
                      <td className="p-2.5 text-slate-300">1/1.3" Doble Cámara</td>
                      <td className="p-2.5 text-amber-400 font-mono">12MP / 48MP</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">✓ Nativo</td>
                      <td className="p-2.5 text-slate-300">WPML (.KMZ) directo</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Mavic 3 / Pro</td>
                      <td className="p-2.5 text-slate-300">4/3" Hasselblad</td>
                      <td className="p-2.5 text-amber-400 font-mono">20 MP</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">✓ Nativo</td>
                      <td className="p-2.5 text-slate-300">WPML (.KMZ) directo</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Mini 3 Pro</td>
                      <td className="p-2.5 text-slate-300">1/1.3" CMOS</td>
                      <td className="p-2.5 text-amber-400 font-mono">12MP / 48MP</td>
                      <td className="p-2.5 text-slate-500 font-semibold">No nativo</td>
                      <td className="p-2.5 text-slate-300">Disparo intervalo / Litchi</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Mini 2 / 4K</td>
                      <td className="p-2.5 text-slate-300">1/2.3" CMOS</td>
                      <td className="p-2.5 text-amber-400 font-mono">12 MP</td>
                      <td className="p-2.5 text-slate-500 font-semibold">No nativo</td>
                      <td className="p-2.5 text-slate-300">Disparo intervalo / Litchi CSV</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-200">DJI Air 2S</td>
                      <td className="p-2.5 text-slate-300">1" CMOS</td>
                      <td className="p-2.5 text-amber-400 font-mono">20 MP</td>
                      <td className="p-2.5 text-slate-500 font-semibold">No nativo</td>
                      <td className="p-2.5 text-slate-300">Litchi Mission Hub / CSV</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'topography' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-100">
                Parámetros Críticos para un Levantamiento Exitoso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Traslapes (Overlap)
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Para ortofotografías 2D estándar en terreno plano: <strong>75% frontal</strong> y{' '}
                    <strong>65% lateral</strong>. Para modelos de elevación 3D, canteras o edificaciones: usa al menos{' '}
                    <strong>80% frontal y 70% lateral</strong> con doble cuadrícula.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="font-bold text-sky-300 mb-1 flex items-center gap-1.5">
                    <Camera className="w-4 h-4" /> Velocidad de Obturación
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Para evitar fotos borrosas (motion blur), mantén la velocidad de obturación en al
                    menos <strong>1/1000s</strong> (o más rápida como 1/1600s). Ajusta el ISO a 100 y vuela en
                    días con buena iluminación difusa.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> Orientación de Líneas
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Orienta las líneas paralelas a la dimensión más larga del polígono. Esto minimiza el
                    número de virajes y giros del dron, ahorrando hasta un 30% de batería. Usa el botón "Calcular Orientación Óptima" de SkyGrid.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Puntos de Apoyo (GCP)
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Si tu dron no cuenta con RTK integrado (como Mini 4 Pro o Air 3), coloca dianas o puntos
                    de control terrestre (GCPs) medidos con GPS GNSS de doble frecuencia para georreferenciación centimétrica en Pix4D, Agisoft Metashape o DJI Terra.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'checklist' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-100">
                Lista de Verificación Antes de Despegar (Checklist)
              </h3>
              <div className="space-y-2">
                {[
                  'Baterías del dron y del mando cargadas al 100%.',
                  'Tarjeta MicroSD rápida (U3 / V30 / A2) formateada y con espacio suficiente.',
                  'Lente de la cámara completamente limpio (sin polvo ni huellas).',
                  'Calibración de brújula e IMU verificada en el sitio de vuelo.',
                  'Punto de Despegue (Home Point) verificado con más de 12 satélites GPS.',
                  'Configuración de altura de seguridad RTH superior a los obstáculos y árboles circundantes.',
                  'Cámara configurada en modo manual: Shutter ≥ 1/1000s, ISO 100, Balance de blancos fijo (Soleado).',
                  'Enfoque bloqueado en infinito (Manual Focus / MF).',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
