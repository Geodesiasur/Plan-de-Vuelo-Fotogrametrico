import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, Trash2, Download, Upload, Check, Calendar, MapPin } from 'lucide-react';
import { FlightPlan } from '../types/drone';
import { formatDistance, formatDuration } from '../utils/photogrammetry';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: FlightPlan | null;
  onLoadProject: (plan: FlightPlan) => void;
}

const STORAGE_KEY = 'skygrid_saved_projects_v1';

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onLoadProject,
}) => {
  const [savedProjects, setSavedProjects] = useState<FlightPlan[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedProjects(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    if (currentPlan) {
      setSaveTitle(currentPlan.name || 'Misión Fotogramétrica');
    }
  }, [isOpen, currentPlan]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!currentPlan) return;
    const newProject: FlightPlan = {
      ...currentPlan,
      name: saveTitle.trim() || 'Misión sin título',
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProject, ...savedProjects.filter((p) => p.id !== newProject.id)];
    setSavedProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDelete = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported: FlightPlan = JSON.parse(text);
      if (imported && Array.isArray(imported.waypoints) && Array.isArray(imported.polygon)) {
        onLoadProject(imported);
        onClose();
      } else {
        alert('Archivo de proyecto no válido.');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Gestor de Proyectos de Vuelo
              </h2>
              <p className="text-xs text-slate-400">
                Guarda misiones localmente en tu navegador o restaura proyectos previos
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

        {/* Save Current Project Box */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Nombre para guardar la misión actual..."
            className="flex-1 h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-medium focus:border-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleSaveCurrent}
            disabled={!currentPlan || currentPlan.polygon.length < 3}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? '¡Guardado!' : 'Guardar Actual'}</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {savedProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No tienes proyectos guardados aún en este navegador.</p>
              <p className="mt-1 text-[11px]">
                Delimita un área en el mapa y haz clic en "Guardar Actual".
              </p>
            </div>
          ) : (
            savedProjects.map((project) => (
              <div
                key={project.id}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">{project.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-amber-400">
                      GSD {project.settings.gsdCm.toFixed(1)} cm/px
                    </span>
                    <span>•</span>
                    <span className="font-mono text-sky-400">
                      {project.waypoints.length} waypoints
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">
                      {formatDuration(project.metrics.flightTimeSec)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      onLoadProject(project);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                  >
                    Cargar en Mapa
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar proyecto guardado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with JSON import */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <label className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Cargar backup .JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
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
