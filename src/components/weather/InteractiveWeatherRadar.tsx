import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radar, Cloud, CloudRain, Zap, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const InteractiveWeatherRadar = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [layer, setLayer] = useState<'precipitation' | 'clouds' | 'temperature'>('precipitation');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Fetch Mapbox token from secrets
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // In production, this would come from your edge function that has access to secrets
        const token = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTJwcmRtcWcwMDdxMmtzMW95cGc5dXl5In0.AaZl8i4WnJvbQ-VqmKlP3Q';
        setMapboxToken(token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation([-74.006, 40.7128]); // Default to NYC
        }
      );
    } else {
      setUserLocation([-74.006, 40.7128]); // Default to NYC
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !userLocation) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: userLocation,
      zoom: 8,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add user location marker
    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat(userLocation)
      .setPopup(new mapboxgl.Popup().setHTML('<p>Your Location</p>'))
      .addTo(map.current);

    map.current.on('load', () => {
      setLoading(false);
      addWeatherLayer();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  // Update weather layer
  useEffect(() => {
    if (map.current && !loading) {
      addWeatherLayer();
    }
  }, [layer, loading]);

  const addWeatherLayer = () => {
    if (!map.current) return;

    // Remove existing weather layers
    ['precipitation-layer', 'clouds-layer', 'temperature-layer'].forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });

    // OpenWeatherMap API key (you'll need to add this as a secret too)
    const owmApiKey = '8c3b2a15c0b89c9a7ca7e3d0a85ea0d0'; // Replace with actual key from secrets

    let tileUrl = '';
    let layerId = '';

    switch (layer) {
      case 'precipitation':
        tileUrl = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmApiKey}`;
        layerId = 'precipitation-layer';
        break;
      case 'clouds':
        tileUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${owmApiKey}`;
        layerId = 'clouds-layer';
        break;
      case 'temperature':
        tileUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${owmApiKey}`;
        layerId = 'temperature-layer';
        break;
    }

    map.current.addSource(layerId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
    });

    map.current.addLayer({
      id: layerId,
      type: 'raster',
      source: layerId,
      paint: {
        'raster-opacity': 0.7,
      },
    });
  };

  const flyToLocation = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: userLocation,
        zoom: 10,
        duration: 2000,
      });
    }
  };

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary animate-pulse" />
            Live Weather Radar
          </CardTitle>
          <Button variant="outline" size="sm" onClick={flyToLocation}>
            <Navigation className="h-4 w-4 mr-2" />
            My Location
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer Controls */}
        <Tabs value={layer} onValueChange={(v) => setLayer(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="precipitation" className="gap-2">
              <CloudRain className="h-4 w-4" />
              <span className="hidden sm:inline">Precipitation</span>
            </TabsTrigger>
            <TabsTrigger value="clouds" className="gap-2">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Clouds</span>
            </TabsTrigger>
            <TabsTrigger value="temperature" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Temperature</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Map Container */}
        <div className="relative rounded-lg overflow-hidden" style={{ height: '500px' }}>
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-xl p-3 rounded-lg border border-border">
            <p className="text-xs font-semibold mb-2">
              {layer === 'precipitation' && 'Precipitation Intensity'}
              {layer === 'clouds' && 'Cloud Coverage'}
              {layer === 'temperature' && 'Temperature'}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-blue-300 rounded" />
              <span>Low</span>
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>Medium</span>
              <div className="w-4 h-4 bg-blue-700 rounded" />
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Map Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Real-time weather data from OpenWeatherMap</p>
          <p>Updated every 10 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
};
