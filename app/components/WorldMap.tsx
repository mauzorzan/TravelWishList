'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface TravelDestination {
  id: number;
  rank: number;
  destination: string;
  country: string;
  latitude: number;
  longitude: number;
  reason: string;
  budget: string;
  timeline: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface WorldMapProps {
  destinations: TravelDestination[];
  selectedDestination: TravelDestination | null;
  onSelectDestination?: (destination: TravelDestination) => void;
}

const SF_COORDS = { latitude: 37.7749, longitude: -122.4194 };

const TIMELINE_LABELS: Record<string, string> = {
  '2025-q1': '🌸 Q1 2025',
  '2025-q2': '☀️ Q2 2025',
  '2025-q3': '🍂 Q3 2025',
  '2025-q4': '❄️ Q4 2025',
  '2026': '🗓️ 2026',
  'someday': '✨ Someday',
};

const WorldMap: React.FC<WorldMapProps> = ({ destinations, selectedDestination, onSelectDestination }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const planeSeriesRef = useRef<any>(null);
  const markerSeriesRef = useRef<any>(null);
  const destinationsRef = useRef<TravelDestination[]>([]);
  const onSelectRef = useRef(onSelectDestination);
  const [mapReady, setMapReady] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });
  const prevDestIdRef = useRef<number | null>(null);

  // Keep refs updated
  useEffect(() => {
    destinationsRef.current = destinations;
  }, [destinations]);

  useEffect(() => {
    onSelectRef.current = onSelectDestination;
  }, [onSelectDestination]);

  // Initialize map only once
  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (!mapDivRef.current) return;

      const am4core = await import('@amcharts/amcharts4/core');
      const am4maps = await import('@amcharts/amcharts4/maps');
      const worldGeodata = (await import('@amcharts/amcharts4-geodata/worldHigh')).default;
      const am4themes_animated = (await import('@amcharts/amcharts4/themes/animated')).default;

      if (disposed) return;

      am4core.useTheme(am4themes_animated);

      const chart = am4core.create(mapDivRef.current, am4maps.MapChart);
      chart.geodata = worldGeodata;
      chart.projection = new am4maps.projections.Miller();
      chart.homeZoomLevel = 1.2;
      chart.homeGeoPoint = { latitude: 30, longitude: 0 };
      chart.chartContainer.wheelable = false;

      // Countries
      const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.exclude = ['AQ'];
      polygonSeries.mapPolygons.template.fill = am4core.color('#1e3a5f');
      polygonSeries.mapPolygons.template.stroke = am4core.color('#2d5a87');
      polygonSeries.mapPolygons.template.strokeWidth = 0.5;

      // Flight line series
      const lineSeries = chart.series.push(new am4maps.MapLineSeries());
      lineSeries.mapLines.template.strokeWidth = 3;
      lineSeries.mapLines.template.stroke = am4core.color('#ffd93d');
      lineSeries.mapLines.template.strokeOpacity = 0.9;
      lineSeries.mapLines.template.strokeDasharray = '6,3';
      lineSeries.mapLines.template.nonScalingStroke = true;
      lineSeries.zIndex = 10;

      // Plane series
      const planeSeries = chart.series.push(new am4maps.MapImageSeries());
      planeSeries.mapImages.template.nonScaling = true;

      // City markers
      const markerSeries = chart.series.push(new am4maps.MapImageSeries());
      markerSeries.mapImages.template.propertyFields.longitude = 'longitude';
      markerSeries.mapImages.template.propertyFields.latitude = 'latitude';
      markerSeries.mapImages.template.nonScaling = true;
      markerSeries.mapImages.template.tooltipText = '{title}';
      markerSeries.mapImages.template.cursorOverStyle = am4core.MouseCursorStyle.pointer;

      // Circle background
      const circle = markerSeries.mapImages.template.createChild(am4core.Circle);
      circle.radius = 12;
      circle.propertyFields.fill = 'color';
      circle.stroke = am4core.color('#fff');
      circle.strokeWidth = 2;

      // Rank label inside circle
      const label = markerSeries.mapImages.template.createChild(am4core.Label);
      label.text = '{rank}';
      label.fill = am4core.color('#fff');
      label.fontSize = 10;
      label.fontWeight = 'bold';
      label.horizontalCenter = 'middle';
      label.verticalCenter = 'middle';
      label.dy = 0;

      // Click handler - uses refs to get current values
      markerSeries.mapImages.template.events.on('hit', (ev: any) => {
        const data = ev.target.dataItem?.dataContext as any;
        if (data?.id !== undefined) {
          const destId = typeof data.id === 'string' ? parseInt(data.id, 10) : data.id;
          const dest = destinationsRef.current.find(d => d.id === destId);
          if (dest && onSelectRef.current) {
            onSelectRef.current(dest);
          }
        }
      });

      // Zoom controls
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = 'right';
      chart.zoomControl.valign = 'middle';

      // Store refs
      chartRef.current = chart;
      lineSeriesRef.current = lineSeries;
      planeSeriesRef.current = planeSeries;
      markerSeriesRef.current = markerSeries;
      
      setMapReady(true);
    };

    init();

    return () => {
      disposed = true;
      setMapReady(false);
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []); // Only run once

  // Update markers when destinations change
  useEffect(() => {
    if (!mapReady || !markerSeriesRef.current) return;

    const updateMarkers = async () => {
      const am4core = await import('@amcharts/amcharts4/core');
      
      const markers = [
        { 
          latitude: SF_COORDS.latitude, 
          longitude: SF_COORDS.longitude, 
          title: 'San Francisco (Home)', 
          color: am4core.color('#06b6d4'),
          id: -1,
          rank: '✈' // SF marker shows plane icon
        },
        ...destinations.map(d => ({
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          title: `${d.destination}, ${d.country}`,
          color: am4core.color('#ff6b6b'),
          id: d.id,
          rank: String(d.rank)
        }))
      ];
      
      markerSeriesRef.current.data = markers;
    };

    updateMarkers();
  }, [mapReady, destinations]);

  // Animate when destination changes
  useEffect(() => {
    if (!mapReady || !selectedDestination) {
      setShowBubble(false);
      return;
    }

    // Skip if same destination
    if (prevDestIdRef.current === selectedDestination.id) {
      return;
    }
    prevDestIdRef.current = selectedDestination.id;

    const chart = chartRef.current;
    const lineSeries = lineSeriesRef.current;
    const planeSeries = planeSeriesRef.current;

    if (!chart || !lineSeries || !planeSeries) {
      return;
    }

    // Clear previous
    setShowBubble(false);
    try {
      lineSeries.mapLines.clear();
      planeSeries.mapImages.clear();
    } catch (e) {
      // ignore
    }

    const animate = async () => {
      try {
        const am4core = await import('@amcharts/amcharts4/core');

        const destLat = Number(selectedDestination.latitude);
        const destLon = Number(selectedDestination.longitude);

        // Create line
        const line = lineSeries.mapLines.create();
        line.multiGeoLine = [[
          { latitude: SF_COORDS.latitude, longitude: SF_COORDS.longitude },
          { latitude: destLat, longitude: destLon }
        ]];

        // Create plane
        const planeContainer = planeSeries.mapImages.create();
        planeContainer.latitude = SF_COORDS.latitude;
        planeContainer.longitude = SF_COORDS.longitude;

        const planeSprite = planeContainer.createChild(am4core.Sprite);
        planeSprite.path = 'm2,106h28l24,30h72l-44,-133h35l80,132h98c21,0 21,34 0,34l-98,0 -80,134h-35l43,-133h-71l-24,30h-28l15,-47';
        planeSprite.fill = am4core.color('#ffd93d');
        planeSprite.scale = 0.18;
        planeSprite.strokeOpacity = 0;
        planeSprite.horizontalCenter = 'middle';
        planeSprite.verticalCenter = 'middle';

        // Calculate direction (shortest path)
        let dLon = destLon - SF_COORDS.longitude;
        const dLat = destLat - SF_COORDS.latitude;
        if (dLon > 180) dLon -= 360;
        if (dLon < -180) dLon += 360;
        planeSprite.rotation = Math.atan2(-dLat, dLon) * (180 / Math.PI);

        // Animate flight
        planeContainer.animate({ property: 'latitude', to: destLat }, 2000, am4core.ease.sinInOut);
        planeContainer.animate({ property: 'longitude', to: destLon }, 2000, am4core.ease.sinInOut);

        // Zoom out
        chart.goHome(500);

        // Show bubble after flight
        setTimeout(() => {
          try {
            if (!chartRef.current) return;
            const point = chartRef.current.geoPointToSVG({
              latitude: destLat,
              longitude: destLon
            });
            if (point && !isNaN(point.x) && !isNaN(point.y)) {
              setBubblePos({ x: point.x, y: point.y });
              setShowBubble(true);
            }
          } catch (e) {
            // ignore
          }
        }, 2200);
      } catch (e) {
        console.error('Animation error:', e);
      }
    };

    const timer = setTimeout(animate, 100);
    return () => clearTimeout(timer);
  }, [mapReady, selectedDestination]);

  const timeline = selectedDestination ? TIMELINE_LABELS[selectedDestination.timeline] || '✨ Someday' : '';

  return (
    <div className="relative">
      <div 
        ref={mapDivRef} 
        className="w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#0c1929' }}
      />
      
      {showBubble && selectedDestination && (
        <div 
          className="absolute z-20"
          style={{
            left: bubblePos.x,
            top: bubblePos.y,
            transform: 'translate(-50%, -100%) translateY(-12px)',
            pointerEvents: 'none'
          }}
        >
          <div 
            className="relative bg-slate-800 rounded-xl p-3 shadow-xl border border-slate-600 min-w-[180px] max-w-[240px]"
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #475569'
              }}
            />
            
            <h3 className="text-sm font-bold text-white text-center">{selectedDestination.destination}</h3>
            <p className="text-slate-400 text-xs text-center mb-2">📍 {selectedDestination.country}</p>
            
            {selectedDestination.reason && (
              <p className="text-slate-300 text-xs text-center italic mb-2 line-clamp-2">
                &ldquo;{selectedDestination.reason}&rdquo;
              </p>
            )}
            
            <div className="flex justify-center">
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500 text-white">
                {timeline}
              </span>
            </div>
            
            <button
              onClick={() => setShowBubble(false)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-600 text-white text-xs hover:bg-slate-500 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
