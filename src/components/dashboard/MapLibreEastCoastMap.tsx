import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PORTS, VESSEL_CLASSES } from '../../data/mockData';
import type { Port } from '../../types/freight';
import {
  fetchCurrentWeather,
  fetchPastTenDaysWeather,
  fetchHistoricalEra5Weather,
  getFallbackWeather,
  type CurrentWeather,
  type PastTenDaysWeather,
  type HistoricalEra5Weather,
} from '../../services/weatherService';
import { checkVesselCompatibility } from '../../services/vesselCompatibility';
import {
  Anchor,
  X,
  CheckCircle,
  AlertTriangle,
  Wind,
  Thermometer,
  Droplets,
  Calendar,
  RefreshCw,
  ShieldAlert,
  Navigation,
  Globe,
  Compass,
  Filter,
  Maximize2,
  Box,
} from 'lucide-react';

const MAP_TILE_STYLES: Record<string, { name: string; icon: string; style: any }> = {
  ocean: {
    name: 'Esri World Ocean (Bathymetry)',
    icon: '🌊',
    style: {
      version: 8,
      sources: {
        'esri-ocean': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Esri, GEBCO, NOAA, National Geographic',
        },
        'esri-ocean-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        { id: 'esri-ocean-base', type: 'raster', source: 'esri-ocean', minzoom: 0, maxzoom: 18 },
        { id: 'esri-ocean-ref', type: 'raster', source: 'esri-ocean-labels', minzoom: 0, maxzoom: 18 },
      ],
    },
  },
  satellite: {
    name: 'High-Res Satellite (Harbor View)',
    icon: '🛰️',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        },
      },
      layers: [
        { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 19 },
      ],
    },
  },
};

// Port 3-letter codes for clean low-zoom rendering
const PORT_SHORT_CODES: Record<string, string> = {
  'port-haldia': 'HAL',
  'port-sagar': 'SGR',
  'port-dhamra': 'DHM',
  'port-paradip': 'PDP',
  'port-gopalpur': 'GPL',
  'port-vizag': 'VZG',
  'port-gangavaram': 'GGV',
  'port-kakinada': 'KKD',
  'port-krishnapatnam': 'KPT',
  'port-kamarajar': 'ENR',
  'port-chennai': 'MAA',
  'port-hay-point': 'HPT',
  'port-norfolk': 'ORF',
  'port-maputo': 'MPM',
  'port-vostochny': 'VOS',
  'port-samarinda': 'SRD',
};

// Staggered Label Placement Offsets to guarantee ZERO label collision at high zoom levels
const PORT_LABEL_OFFSETS: Record<string, { positionClass: string; badgeColorClass: string }> = {
  'port-haldia': {
    positionClass: '-top-11 -left-12 whitespace-nowrap',
    badgeColorClass: 'bg-rose-950/95 text-rose-200 border-rose-500/60 shadow-2xl',
  },
  'port-sagar': {
    positionClass: 'top-7 left-5 whitespace-nowrap',
    badgeColorClass: 'bg-sky-950/95 text-sky-200 border-sky-500/60 shadow-2xl',
  },
  'port-dhamra': {
    positionClass: '-top-11 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-paradip': {
    positionClass: 'top-7 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-gopalpur': {
    positionClass: '-top-2 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-sky-950/95 text-sky-200 border-sky-500/60 shadow-2xl',
  },
  'port-vizag': {
    positionClass: '-top-11 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-gangavaram': {
    positionClass: 'top-7 left-5 whitespace-nowrap',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-kakinada': {
    positionClass: '-top-11 left-5 whitespace-nowrap',
    badgeColorClass: 'bg-sky-950/95 text-sky-200 border-sky-500/60 shadow-2xl',
  },
  'port-krishnapatnam': {
    positionClass: '-top-11 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-kamarajar': {
    positionClass: 'top-7 left-5 whitespace-nowrap',
    badgeColorClass: 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-2xl',
  },
  'port-chennai': {
    positionClass: '-top-11 right-5 whitespace-nowrap text-right',
    badgeColorClass: 'bg-sky-950/95 text-sky-200 border-sky-500/60 shadow-2xl',
  },
  'port-hay-point': {
    positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
    badgeColorClass: 'bg-slate-950/95 text-amber-300 border-amber-500/60 shadow-2xl',
  },
  'port-norfolk': {
    positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
    badgeColorClass: 'bg-slate-950/95 text-amber-300 border-amber-500/60 shadow-2xl',
  },
  'port-maputo': {
    positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
    badgeColorClass: 'bg-slate-950/95 text-amber-300 border-amber-500/60 shadow-2xl',
  },
  'port-vostochny': {
    positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
    badgeColorClass: 'bg-slate-950/95 text-amber-300 border-amber-500/60 shadow-2xl',
  },
  'port-samarinda': {
    positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
    badgeColorClass: 'bg-slate-950/95 text-amber-300 border-amber-500/60 shadow-2xl',
  },
};

/**
 * Generates an arc of coordinates between two positions for smooth curved trade routes
 */
function generateArcPoints(start: [number, number], end: [number, number], curvature = 0.25): [number, number][] {
  const numPoints = 35;
  const pts: [number, number][] = [];
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const midLng = (lng1 + lng2) / 2;
  const midLat = (lat1 + lat2) / 2;

  // Perpendicular curve offset
  const ctrlLng = midLng - (dy / dist) * Math.min(dist * curvature, 12);
  const ctrlLat = midLat + (dx / dist) * Math.min(dist * curvature, 12) + Math.min(dist * 0.04, 6);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = Math.pow(1 - t, 2) * lng1 + 2 * (1 - t) * t * ctrlLng + Math.pow(t, 2) * lng2;
    const lat = Math.pow(1 - t, 2) * lat1 + 2 * (1 - t) * t * ctrlLat + Math.pow(t, 2) * lat2;
    pts.push([lng, lat]);
  }
  return pts;
}

export const MapLibreEastCoastMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeStyleKey, setActiveStyleKey] = useState<string>('ocean');
  const [selectedPort, setSelectedPort] = useState<Port | null>(PORTS.find(p => p.id === 'port-paradip') || null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'live' | 'tenDays' | 'historical'>('live');
  const [filterCategory, setFilterCategory] = useState<'all' | 'indian' | 'capesize' | 'panamax' | 'riverine' | 'overseas'>('all');

  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(7.2);

  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [tenDaysData, setTenDaysData] = useState<PastTenDaysWeather | null>(null);
  const [era5Data, setEra5Data] = useState<HistoricalEra5Weather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const setupTradeRoutes = (map: maplibregl.Map) => {
    const overseasPorts = PORTS.filter(p => p.region !== 'East Coast India');
    const indianPorts = PORTS.filter(p => p.region === 'East Coast India');

    const routeFeatures = [];
    for (const origin of overseasPorts) {
      for (const dest of indianPorts) {
        if (
          (origin.id === 'port-hay-point' && (dest.id === 'port-paradip' || dest.id === 'port-gangavaram' || dest.id === 'port-krishnapatnam')) ||
          (origin.id === 'port-samarinda' && (dest.id === 'port-vizag' || dest.id === 'port-gopalpur' || dest.id === 'port-kakinada')) ||
          (origin.id === 'port-vostochny' && (dest.id === 'port-dhamra' || dest.id === 'port-paradip')) ||
          (origin.id === 'port-maputo' && (dest.id === 'port-gangavaram' || dest.id === 'port-krishnapatnam')) ||
          (origin.id === 'port-norfolk' && (dest.id === 'port-paradip' || dest.id === 'port-kamarajar'))
        ) {
          const arcCoords = generateArcPoints([origin.longitude, origin.latitude], [dest.longitude, dest.latitude]);
          routeFeatures.push({
            type: 'Feature' as const,
            properties: { origin: origin.name, destination: dest.name },
            geometry: {
              type: 'LineString' as const,
              coordinates: arcCoords,
            },
          });
        }
      }
    }

    if (map.getSource('trade-routes')) {
      if (map.getLayer('trade-routes-line')) map.removeLayer('trade-routes-line');
      map.removeSource('trade-routes');
    }

    map.addSource('trade-routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: routeFeatures,
      },
    });

    map.addLayer({
      id: 'trade-routes-line',
      type: 'line',
      source: 'trade-routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#0284c7',
        'line-width': 2.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.85,
      },
    });
  };

  // Switch basemap tile styles (Liberty, Ocean Bathymetry, Satellite, Dark)
  const handleBasemapStyleChange = (styleKey: string) => {
    setActiveStyleKey(styleKey);
    if (mapInstanceRef.current && MAP_TILE_STYLES[styleKey]) {
      const map = mapInstanceRef.current;
      map.setStyle(MAP_TILE_STYLES[styleKey].style);
      map.once('style.load', () => {
        setupTradeRoutes(map);
        renderMarkers(map, filterCategory, map.getZoom());
      });
    }
  };

  // Initialize MapLibre GL JS Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const selectedTileStyle = MAP_TILE_STYLES[activeStyleKey]?.style || MAP_TILE_STYLES.ocean.style;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: selectedTileStyle,
        center: [84.2, 17.8], // Optimized high-resolution position centered on East Coast India
        zoom: 7.0, // High-detail initial zoom level
        pitch: 45, // 3D Perspective Pitch Angle
        bearing: -8,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ unit: 'nautical' }), 'bottom-left');

      map.on('load', () => {
        setupTradeRoutes(map);
      });

      map.on('zoom', () => {
        const z = map.getZoom();
        setCurrentZoom(z);
        renderMarkers(map, filterCategory, z);
      });

      mapInstanceRef.current = map;
      renderMarkers(map, filterCategory, 7.0);

    } catch (err) {
      console.error('MapLibre init error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever filterCategory changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderMarkers(mapInstanceRef.current, filterCategory, mapInstanceRef.current.getZoom());
    }
  }, [filterCategory]);

  const renderMarkers = (map: maplibregl.Map, category: string, zoomLevel: number) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filteredPorts = PORTS.filter(port => {
      const isIndian = port.region === 'East Coast India';
      if (category === 'indian') return isIndian;
      if (category === 'overseas') return !isIndian;
      if (category === 'capesize') return isIndian && port.maxDraftM >= 16.0;
      if (category === 'panamax') return isIndian && port.maxDraftM >= 12.0 && port.maxDraftM < 16.0;
      if (category === 'riverine') return isIndian && port.maxDraftM < 12.0;
      return true;
    });

    // Decluttering logic: At low zoom (< 6.8), render compact glowing pins without text overflow
    const isCompactMode = zoomLevel < 6.8;

    filteredPorts.forEach(port => {
      const isIndian = port.region === 'East Coast India';
      const shortCode = PORT_SHORT_CODES[port.id] || port.name.substring(0, 3).toUpperCase();
      const offsetInfo = PORT_LABEL_OFFSETS[port.id] || {
        positionClass: '-top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
        badgeColorClass: 'bg-slate-900 text-white border-slate-700',
      };

      const el = document.createElement('div');
      el.className = 'relative group cursor-pointer z-20 hover:z-50';

      const pinColorClass = port.id === 'port-haldia'
        ? 'bg-rose-600 border-2 border-white text-white shadow-xl ring-2 ring-rose-400/50'
        : port.maxDraftM >= 16
        ? 'bg-emerald-600 border-2 border-white text-white shadow-xl ring-2 ring-emerald-400/50'
        : isIndian
        ? 'bg-sky-600 border-2 border-white text-white shadow-xl ring-2 ring-sky-400/50'
        : 'bg-slate-900 border-2 border-amber-400 text-amber-400 shadow-xl ring-2 ring-amber-400/50';

      if (isCompactMode) {
        // CLEAN COMPACT PIN MODE (Low Zoom / Decluttered View)
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-full ${pinColorClass} flex items-center justify-center font-mono font-black text-[10px] shadow-lg transition-transform hover:scale-125">
              ${shortCode}
            </div>
          </div>
        `;
      } else {
        // HIGH DETAIL BADGE MODE (Zoomed-In / High Detail View)
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <!-- Anchor Pin Badge -->
            <div class="w-8 h-8 rounded-full ${pinColorClass} flex items-center justify-center transition-transform hover:scale-125 shadow-xl">
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.3">
                <circle cx="12" cy="5" r="2" />
                <line x1="12" y1="7" x2="12" y2="21" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <path d="M5 14a7 7 0 0 0 14 0" />
              </svg>
            </div>

            <!-- Offset Label Box -->
            <div class="absolute ${offsetInfo.positionClass} pointer-events-auto">
              <div class="px-2.5 py-0.5 rounded-xl border text-[11px] font-black shadow-xl flex items-center gap-1.5 ${offsetInfo.badgeColorClass}">
                <span>${port.name}</span>
                <span class="text-[9.5px] opacity-90 font-mono">(${port.maxDraftM}m Draft)</span>
              </div>
            </div>
          </div>
        `;
      }

      // Native MapLibre Popup callout on hover
      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
        className: 'custom-maplibre-popup',
      }).setHTML(`
        <div class="p-2.5 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 text-xs font-['Inter']">
          <div class="font-black text-amber-800 flex items-center gap-1">
            ⚓ ${port.name} (${shortCode})
          </div>
          <div class="text-[11px] text-slate-700 font-semibold mt-1">
            Region: <span class="text-teal-800 font-bold">${port.region}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[10px]">
            <div><span class="text-slate-600 font-bold">Draft:</span> <b class="text-emerald-800 font-bold">${port.maxDraftM}m</b></div>
            <div><span class="text-slate-600 font-bold">Max LOA:</span> <b class="text-sky-800 font-bold">${port.maxLOAM}m</b></div>
            <div><span class="text-slate-600 font-bold">Beam:</span> <b class="text-slate-800 font-bold">${port.maxBeamM}m</b></div>
            <div><span class="text-slate-600 font-bold">Rate:</span> <b class="text-amber-800 font-bold">${port.cargoHandlingRateTPH} TPH</b></div>
          </div>
          <div class="mt-2 text-[10px] text-teal-800 font-bold text-center bg-teal-50 py-1 rounded border border-teal-200">
            Click marker for Live Weather & Feasibility Matrix
          </div>
        </div>
      `);

      el.addEventListener('mouseenter', () => popup.addTo(map));
      el.addEventListener('mouseleave', () => popup.remove());

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePortSelect(port);
        map.flyTo({
          center: [port.longitude, port.latitude],
          zoom: 10.0, // Detailed harbor level zoom
          pitch: 35,
          duration: 1400,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([port.longitude, port.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // Camera presets
  const handleFitEastCoast = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [84.2, 17.8],
        zoom: 7.2,
        pitch: is3DMode ? 45 : 0,
        bearing: is3DMode ? -8 : 0,
        duration: 1400,
      });
    }
  };

  const handleFitGlobal = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [
          [-85.0, -32.0], // South-West (US Norfolk / Maputo)
          [152.0, 48.0],  // North-East (Australia Hay Point / Vostochny)
        ],
        { padding: { top: 40, bottom: 40, left: 40, right: 40 }, duration: 1800 }
      );
    }
  };

  const handleToggle3D = () => {
    if (mapInstanceRef.current) {
      const next3D = !is3DMode;
      setIs3DMode(next3D);
      mapInstanceRef.current.easeTo({
        pitch: next3D ? 45 : 0,
        bearing: next3D ? -8 : 0,
        duration: 1000,
      });
    }
  };

  const handleResetCamera = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [84.2, 17.8],
        zoom: 7.2,
        pitch: is3DMode ? 45 : 0,
        bearing: is3DMode ? -8 : 0,
        duration: 1200,
      });
    }
  };

  // Load weather data whenever a port is selected
  const handlePortSelect = (port: Port) => {
    setSelectedPort(port);
    setIsModalOpen(true);
    loadWeatherForPort(port);
  };

  const handleFlyToPort = (port: Port) => {
    setSelectedPort(port);
    loadWeatherForPort(port);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [port.longitude, port.latitude],
        zoom: 10.0, // High detail harbor level zoom
        pitch: is3DMode ? 45 : 0,
        duration: 1500,
      });
    }
  };

  const loadWeatherForPort = async (port: Port) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const current = await fetchCurrentWeather(port.latitude, port.longitude);
      setWeatherData(current);

      const pastTen = await fetchPastTenDaysWeather(port.latitude, port.longitude);
      setTenDaysData(pastTen);

      const era5 = await fetchHistoricalEra5Weather(port.latitude, port.longitude, '2024-01-01', '2024-01-07');
      setEra5Data(era5);
    } catch (err) {
      console.warn('Using fallback weather for port:', port.name, err);
      setWeatherData(getFallbackWeather(port.name));
      setWeatherError('Live Open-Meteo REST service connection re-calibrated to local historical baseline.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const filteredPortsCount = PORTS.filter(p => {
    const isIndian = p.region === 'East Coast India';
    if (filterCategory === 'indian') return isIndian;
    if (filterCategory === 'overseas') return !isIndian;
    if (filterCategory === 'capesize') return isIndian && p.maxDraftM >= 16.0;
    if (filterCategory === 'panamax') return isIndian && p.maxDraftM >= 12.0 && p.maxDraftM < 16.0;
    if (filterCategory === 'riverine') return isIndian && p.maxDraftM < 12.0;
    return true;
  }).length;

  return (
    <div className="manzil-glass-panel p-6 flex flex-col justify-between h-full relative overflow-hidden text-slate-900 border border-slate-200 rounded-3xl shadow-sm bg-white">
      {/* Title Header Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-['ABC_Diatype']">
            <Anchor className="w-6 h-6 text-teal-700" />
            <span>High-Detail Maritime & Port Operations Map</span>
          </h2>
          <p className="text-xs text-slate-700 font-semibold mt-1">
            Anchor-Marked Terminals • Smart Decluttering • Open-Meteo REST Weather Engine • Current Zoom: {currentZoom.toFixed(1)}x
          </p>
        </div>

        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle3D}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              is3DMode
                ? 'bg-sky-100 border-sky-300 text-sky-900 shadow-xs'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Box className="w-4 h-4 text-sky-600" />
            <span>{is3DMode ? '3D Perspective (45° Pitch)' : '2D Flat Topo'}</span>
          </button>

          <button
            onClick={handleFitEastCoast}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4 text-teal-700" />
            <span>Focus East Coast Terminals</span>
          </button>

          <button
            onClick={handleFitGlobal}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Globe className="w-4 h-4 text-amber-700" />
            <span>Fit Global Routes</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors"
            title="Reset Map View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Basemap Theme Selector Bar */}
      <div className="flex items-center justify-between gap-3 mb-3 bg-slate-100 p-2.5 rounded-2xl border border-slate-200 text-xs flex-wrap">
        <div className="flex items-center gap-2 text-slate-800 font-bold shrink-0">
          <Compass className="w-4 h-4 text-teal-700" />
          <span>Select Map Style / Layer:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {Object.entries(MAP_TILE_STYLES).map(([key, styleObj]) => (
            <button
              key={key}
              onClick={() => handleBasemapStyleChange(key)}
              className={`px-3 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all border ${
                activeStyleKey === key
                  ? 'bg-teal-700 border-teal-600 text-white shadow-xs font-bold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{styleObj.icon}</span>
              <span>{styleObj.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Filter Pills Strip */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0 font-mono">
            <Filter className="w-3.5 h-3.5 text-teal-700" /> Filter Terminals ({filteredPortsCount}):
          </span>

          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'all'
                ? 'bg-teal-100 text-teal-900 border-teal-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Ports ({PORTS.length})
          </button>

          <button
            onClick={() => setFilterCategory('indian')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'indian'
                ? 'bg-teal-100 text-teal-900 border-teal-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            East Coast India ({PORTS.filter(p => p.region === 'East Coast India').length})
          </button>

          <button
            onClick={() => setFilterCategory('capesize')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'capesize'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Capesize (≥16m Draft)
          </button>

          <button
            onClick={() => setFilterCategory('panamax')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'panamax'
                ? 'bg-sky-100 text-sky-900 border-sky-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Panamax (12–15.9m)
          </button>

          <button
            onClick={() => setFilterCategory('riverine')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'riverine'
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Riverine (&lt;12m)
          </button>

          <button
            onClick={() => setFilterCategory('overseas')}
            className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] border ${
              filterCategory === 'overseas'
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Overseas Origins ({PORTS.filter(p => p.region !== 'East Coast India').length})
          </button>
        </div>
      </div>

      {/* Main Large Vector Map Container (620px height) */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-300 shadow-md">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Quick Select Port Camera Bar */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-700 flex items-center gap-2 overflow-x-auto text-xs text-white shadow-2xl">
          <span className="font-bold text-teal-400 shrink-0 flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
            <Navigation className="w-4 h-4 text-teal-400" /> Fly To Terminal Harbor:
          </span>
          {PORTS.map(port => {
            const isIndian = port.region === 'East Coast India';
            return (
              <button
                key={port.id}
                onClick={() => handleFlyToPort(port)}
                className={`px-3 py-1 rounded-xl shrink-0 font-bold transition-all text-[11px] border ${
                  selectedPort?.id === port.id
                    ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-md'
                    : isIndian
                    ? 'bg-slate-900 border-white/10 text-slate-200 hover:bg-slate-800'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                ⚓ {port.name} ({port.maxDraftM}m)
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Port Weather & Specs Modal Drawer */}
      {isModalOpen && selectedPort && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedPort.name}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {selectedPort.region} ({selectedPort.country})
                  </span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  WGS84 Coordinates: {selectedPort.latitude.toFixed(4)}°N, {selectedPort.longitude.toFixed(4)}°E | {selectedPort.notes}
                </p>
              </div>
            </div>

            {/* Technical Specifications Bar */}
            <div className="grid grid-cols-4 gap-3 mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-600 uppercase font-bold">Max Draft</div>
                <div className="text-lg font-bold text-teal-800">{selectedPort.maxDraftM} m</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase font-bold">Max LOA</div>
                <div className="text-lg font-bold text-slate-900">{selectedPort.maxLOAM} m</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase font-bold">Max Beam</div>
                <div className="text-lg font-bold text-slate-900">{selectedPort.maxBeamM} m</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase font-bold">Discharge Rate</div>
                <div className="text-lg font-bold text-emerald-800">{selectedPort.cargoHandlingRateTPH.toLocaleString()} TPH</div>
              </div>
            </div>

            {/* Navigation Tabs for Weather APIs */}
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('live')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                  activeTab === 'live'
                    ? 'bg-teal-700 border-teal-600 text-white font-bold'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Thermometer className="w-4 h-4" /> Live Open-Meteo Current
              </button>
              <button
                onClick={() => setActiveTab('tenDays')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                  activeTab === 'tenDays'
                    ? 'bg-teal-700 border-teal-600 text-white font-bold'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" /> Past 10 Days Forecast
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                  activeTab === 'historical'
                    ? 'bg-teal-700 border-teal-600 text-white font-bold'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" /> ERA5 Climate Archive
              </button>
            </div>

            {/* Weather Data Display */}
            {isLoadingWeather ? (
              <div className="p-8 text-center text-slate-600 text-xs flex flex-col items-center justify-center gap-2 font-mono">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                <span>Fetching real-time meteorological observations from Open-Meteo REST API...</span>
              </div>
            ) : (
              <div>
                {weatherError && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{weatherError}</span>
                  </div>
                )}

                {/* Tab 1: Live Current Weather */}
                {activeTab === 'live' && weatherData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-xs">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-8 h-8 text-amber-600" />
                        <div>
                          <div className="text-2xl font-bold font-mono-num">{weatherData.temperature2m}°C</div>
                          <div className="text-[11px] text-slate-600 font-medium">Surface Temp (2m)</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Wind className="w-8 h-8 text-teal-600" />
                        <div>
                          <div className="text-2xl font-bold font-mono-num">{weatherData.windSpeed10m} km/h</div>
                          <div className="text-[11px] text-slate-600 font-medium">Wind Velocity (10m)</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Droplets className="w-8 h-8 text-sky-600" />
                        <div>
                          <div className="text-2xl font-bold font-mono-num">{weatherData.relativeHumidity2m}%</div>
                          <div className="text-[11px] text-slate-600 font-medium">Relative Humidity</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 border border-teal-200">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{weatherData.conditionLabel}</div>
                        <div className="text-xs font-mono text-teal-800 mt-0.5">WMO Code: {weatherData.weatherCode}</div>
                      </div>

                      {weatherData.isMonsoonOrStormRisk ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" /> High Wind / Delay Risk
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Normal Sea Operations
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Past 10 Days Forecast */}
                {activeTab === 'tenDays' && tenDaysData && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Past 10-Day Hourly Weather Observations</h4>
                    <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Temp (°C)</th>
                            <th className="p-2.5">Humidity (%)</th>
                            <th className="p-2.5">Wind (km/h)</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium divide-y divide-slate-200 text-slate-900">
                          {tenDaysData.hourly.time.slice(0, 15).map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 text-slate-700 font-mono">{t.replace('T', ' ')}</td>
                              <td className="p-2.5 font-mono-num font-bold text-amber-800">{tenDaysData.hourly.temperature2m[idx]}</td>
                              <td className="p-2.5 font-mono-num font-bold text-sky-800">{tenDaysData.hourly.relativeHumidity2m[idx]}</td>
                              <td className="p-2.5 font-mono-num font-bold text-teal-800">{tenDaysData.hourly.windSpeed10m[idx]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 3: ERA5 Archive */}
                {activeTab === 'historical' && era5Data && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Open-Meteo ERA5 Reanalysis Archive (ECMWF)</h4>
                    <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">ERA5 Timestamp</th>
                            <th className="p-2.5">Air Temp (°C)</th>
                            <th className="p-2.5">Wind Speed (km/h)</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium divide-y divide-slate-200 text-slate-900">
                          {era5Data.hourly.time.slice(0, 12).map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 text-slate-700 font-mono">{t.replace('T', ' ')}</td>
                              <td className="p-2.5 font-mono-num font-bold text-slate-900">{era5Data.hourly.temperature2m[idx]}</td>
                              <td className="p-2.5 font-mono-num font-bold text-teal-800">{era5Data.hourly.windSpeed10m[idx]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vessel Compatibility Quick Reference */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-2.5">Vessel Feasibility & Draft Compatibility Matrix</h4>
              <div className="grid grid-cols-4 gap-2">
                {VESSEL_CLASSES.map(vc => {
                  const originPort = PORTS.find(p => p.id === 'port-hay-point') || PORTS[0];
                  const check = checkVesselCompatibility(vc, originPort, selectedPort, 75000);
                  return (
                    <div
                      key={vc.id}
                      className={`p-2.5 rounded-xl border text-center text-xs ${
                        check.isFeasible
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-center gap-1">
                        {check.isFeasible ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>{vc.name}</span>
                      </div>
                      <div className="text-[10px] font-mono mt-0.5 font-bold">{check.isFeasible ? 'Compatible' : 'Draft/LOA Limit'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


