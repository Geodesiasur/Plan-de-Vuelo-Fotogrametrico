import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MapContainer } from './components/MapContainer';
import { FlightConfigSidebar } from './components/FlightConfigSidebar';
import { ExportModal } from './components/ExportModal';
import { FieldGuideModal } from './components/FieldGuideModal';
import { DroneComparatorModal } from './components/DroneComparatorModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { DRONE_CATALOG, findCameraMode, findDrone } from './data/drones';
import {
  CameraMode,
  DroneSpecs,
  FlightPlan,
  FlightPlanMetrics,
  FlightSettings,
  LatLon,
  WaypointItem,
} from './types/drone';
import { generateFlightPlan } from './utils/gridGenerator';
import { calcGsdFromHeight, computeFootprint } from './utils/photogrammetry';

// Default initial polygon (sample agricultural / survey area)
const INITIAL_TAKEOFF: LatLon = { lat: 40.4528, lon: -3.6895 };
const INITIAL_POLYGON: LatLon[] = [
  { lat: 40.4538, lon: -3.6908 },
  { lat: 40.4552, lon: -3.6882 },
  { lat: 40.4542, lon: -3.6859 },
  { lat: 40.4526, lon: -3.6872 },
  { lat: 40.4522, lon: -3.6898 },
];

export default function App() {
  // Mission project name
  const [projectName, setProjectName] = useState<string>('Misión PLAVUF Fotogrametría');

  // Active drone and camera mode
  const [activeDrone, setActiveDrone] = useState<DroneSpecs>(() => DRONE_CATALOG[0]); // DJI Mini 4 Pro
  const [activeCameraMode, setActiveCameraMode] = useState<CameraMode>(
    () => DRONE_CATALOG[0].modes[0]
  );

  // Flight settings state
  const [settings, setSettings] = useState<FlightSettings>(() => ({
    droneId: DRONE_CATALOG[0].id,
    droneModeKey: DRONE_CATALOG[0].modes[0].key,
    heightM: 75,
    gsdCm: parseFloat(calcGsdFromHeight(75, DRONE_CATALOG[0].modes[0]).toFixed(2)),
    speedMs: 5.0,
    frontOverlap: 75,
    sideOverlap: 65,
    bufferM: 0,
    gimbalPitch: -90,
    orientationAngle: 45,
    orientationMode: 'auto',
    pattern: 'grid',
    heightMode: 'relative',
    captureMode: 'waypoint',
    cameraAction: 'photo',
    finishAction: 'rth',
  }));

  // Geographic coordinates
  const [takeoff, setTakeoff] = useState<LatLon | null>(INITIAL_TAKEOFF);
  const [polygon, setPolygon] = useState<LatLon[]>(INITIAL_POLYGON);

  // Map active tool state
  const [activeTool, setActiveTool] = useState<'none' | 'takeoff' | 'draw'>('none');

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals visibility
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // Generate flight plan and metrics dynamically whenever inputs change
  const planResult = useMemo(() => {
    if (!polygon || polygon.length < 3) return null;
    return generateFlightPlan(
      polygon,
      takeoff,
      settings,
      activeCameraMode,
      activeDrone.batteryTimeMinutes
    );
  }, [polygon, takeoff, settings, activeCameraMode, activeDrone]);

  const waypoints: WaypointItem[] = planResult?.waypoints || [];
  const metrics: FlightPlanMetrics | null = planResult?.metrics || null;

  // Single photo footprint ground coverage at height
  const footprint = useMemo(() => {
    return computeFootprint(settings.heightM, activeCameraMode);
  }, [settings.heightM, activeCameraMode]);

  // Construct complete FlightPlan object
  const currentFlightPlan: FlightPlan = useMemo(() => {
    return {
      id: 'plan_' + Date.now(),
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      takeoff,
      polygon,
      settings,
      waypoints,
      metrics: metrics || {
        totalDistanceM: 0,
        flightTimeSec: 0,
        areaM2: 0,
        areaHectares: 0,
        photoCount: 0,
        estimatedBatteries: 1,
        lineCount: 0,
        turnCount: 0,
        routeSpacingM: 0,
        waypointSpacingM: 0,
        recommendedIntervalSec: 2,
        footprintWidthM: footprint.groundWidthM,
        footprintHeightM: footprint.groundHeightM,
        footprintAreaM2: footprint.areaM2,
        optimalOrientationDeg: 0,
      },
    };
  }, [projectName, takeoff, polygon, settings, waypoints, metrics, footprint]);

  // Reset entire mission
  const handleResetMission = () => {
    if (confirm('¿Deseas reiniciar la misión y limpiar el área de mapeo?')) {
      setTakeoff(null);
      setPolygon([]);
      setActiveTool('takeoff');
    }
  };

  // Load a project from storage
  const handleLoadProject = (loadedPlan: FlightPlan) => {
    setProjectName(loadedPlan.name || 'Proyecto Restaurado');
    setTakeoff(loadedPlan.takeoff);
    setPolygon(loadedPlan.polygon);
    if (loadedPlan.settings) {
      setSettings(loadedPlan.settings);
      const drone = findDrone(loadedPlan.settings.droneId);
      const mode = findCameraMode(drone, loadedPlan.settings.droneModeKey);
      setActiveDrone(drone);
      setActiveCameraMode(mode);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#03060a] select-none text-slate-100 font-sans">
      {/* Top Navbar */}
      <Navbar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        activeDrone={activeDrone}
        metrics={metrics}
        gsdCm={settings.gsdCm}
        heightM={settings.heightM}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenComparator={() => setIsComparatorOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onReset={handleResetMission}
      />

      {/* Main Full-Screen Map */}
      <MapContainer
        takeoff={takeoff}
        onTakeoffChange={setTakeoff}
        polygon={polygon}
        onPolygonChange={setPolygon}
        waypoints={waypoints}
        flightHeightM={settings.heightM}
        footprintWidthM={footprint.groundWidthM}
        footprintHeightM={footprint.groundHeightM}
        activeTool={activeTool}
        onActiveToolChange={setActiveTool}
      />

      {/* Left Collapsible Parameter Sidebar */}
      <FlightConfigSidebar
        settings={settings}
        onSettingsChange={setSettings}
        activeDrone={activeDrone}
        onDroneChange={(d, m) => {
          setActiveDrone(d);
          setActiveCameraMode(m);
        }}
        activeCameraMode={activeCameraMode}
        onCameraModeChange={setActiveCameraMode}
        onPolygonImported={(newCoords) => {
          setPolygon(newCoords);
          setActiveTool('none');
        }}
        optimalOrientation={metrics?.optimalOrientationDeg || 0}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        flightPlan={currentFlightPlan}
      />

      <FieldGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <DroneComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
      />

      <ProjectManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentPlan={currentFlightPlan}
        onLoadProject={handleLoadProject}
      />
    </div>
  );
}
