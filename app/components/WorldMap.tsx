'use client';

import { useEffect, useRef, useState } from 'react';

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
  const chartInstanceRef = useRef<any>(null);
  const lineSeriesInstanceRef = useRef<any>(null);
  const planeSeriesInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });
  const prevDestIdRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    let chart: any = null;
    let disposed = false;

    const init = async () => {
      const am4core = await import('@amcharts/amcharts4/core');
      const am4maps = await import('@amcharts/amcharts4/maps');
      const worldGeodata = (await import('@amcharts/amcharts4-geodata/worldHigh')).default;
      const am4themes_animated = (await import('@amcharts/amcharts4/themes/animated')).default;

      if (disposed || !mapDivRef.current) return;

      am4core.useTheme(am4themes_animated);

      chart = am4core.create(mapDivRef.current, am4maps.MapChart);
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

      const circle = markerSeries.mapImages.template.createChild(am4core.Circle);
      circle.radius = 7;
      circle.propertyFields.fill = 'color';
      circle.stroke = am4core.color('#fff');
      circle.strokeWidth = 2;
      circle.nonScaling = true;
      circle.tooltipText = '{title}';
      circle.cursorOverStyle = am4core.MouseCursorStyle.pointer;

      // Marker data
      const markers = [
        { latitude: SF_COORDS.latitude, longitude: SF_COORDS.longitude, title: 'San Francisco', color: am4core.color('#06b6d4') },
        ...destinations.map(d => ({
          latitude: d.latitude,
          longitude: d.longitude,
          title: `${d.destination}, ${d.country}`,
          color: am4core.color('#ff6b6b'),
          id: d.id
        }))
      ];
      markerSeries.data = markers;

      // Click handler
      markerSeries.mapImages.template.events.on('hit', (ev: any) => {
        const data = ev.target.dataItem?.dataContext as any;
        if (data?.id && onSelectDestination) {
          const dest = destinations.find(d => d.id === data.id);
          if (dest) onSelectDestination(dest);
        }
      });

      // Zoom controls
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = 'right';
      chart.zoomControl.valign = 'middle';

      // Store refs
      chartInstanceRef.current = chart;
      lineSeriesInstanceRef.current = lineSeries;
      planeSeriesInstanceRef.current = planeSeries;
      setMapReady(true);
    };

    init();

    return () => {
      disposed = true;
      setMapReady(false);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [destinations, onSelectDestination]);

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

    const chart = chartInstanceRef.current;
    const lineSeries = lineSeriesInstanceRef.current;
    const planeSeries = planeSeriesInstanceRef.current;

    if (!chart || !lineSeries || !planeSeries) {
      console.log('Chart not ready');
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
      const am4core = await import('@amcharts/amcharts4/core');

      // Create line
      const line = lineSeries.mapLines.create();
      line.multiGeoLine = [[
        { latitude: SF_COORDS.latitude, longitude: SF_COORDS.longitude },
        { latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }
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

      // Calculate direction
      let dLon = selectedDestination.longitude - SF_COORDS.longitude;
      const dLat = selectedDestination.latitude - SF_COORDS.latitude;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      planeSprite.rotation = Math.atan2(-dLat, dLon) * (180 / Math.PI);

      // Animate flight
      planeContainer.animate({ property: 'latitude', to: selectedDestination.latitude }, 2000, am4core.ease.sinInOut);
      planeContainer.animate({ property: 'longitude', to: selectedDestination.longitude }, 2000, am4core.ease.sinInOut);

      // Zoom out
      chart.goHome(500);

      // Show bubble after flight
      setTimeout(() => {
        try {
          const point = chart.geoPointToSVG({
            latitude: selectedDestination.latitude,
            longitude: selectedDestination.longitude
          });
          if (point && !isNaN(point.x) && !isNaN(point.y)) {
            setBubblePos({ x: point.x, y: point.y });
            setShowBubble(true);
          }
        } catch (e) {
          // ignore
        }
      }, 2200);
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
