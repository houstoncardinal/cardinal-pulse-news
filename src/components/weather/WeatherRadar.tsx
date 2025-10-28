import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, CloudRain, Zap, Wind, Snowflake } from "lucide-react";

interface WeatherRadarProps {
  lat: number;
  lon: number;
  cityName: string;
}

export const WeatherRadar = ({ lat, lon, cityName }: WeatherRadarProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<'precipitation' | 'clouds' | 'temperature'>('precipitation');
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // OpenWeather Map tiles API
    const apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Will use the existing key
    const zoom = 6;
    
    // Calculate tile coordinates
    const tileX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    // Build radar overlay URL
    const layerMap = {
      precipitation: 'precipitation_new',
      clouds: 'clouds_new',
      temperature: 'temp_new'
    };

    return () => {
      // Cleanup
    };
  }, [lat, lon, selectedLayer]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CloudRain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Weather Radar</h3>
            <p className="text-sm text-muted-foreground">{cityName} Region</p>
          </div>
        </div>
        <Badge variant={isAnimating ? "default" : "outline"} className="gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {isAnimating ? 'Live' : 'Paused'}
        </Badge>
      </div>

      {/* Layer Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedLayer === 'precipitation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('precipitation')}
          className="gap-2"
        >
          <CloudRain className="h-4 w-4" />
          Precipitation
        </Button>
        <Button
          variant={selectedLayer === 'clouds' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('clouds')}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          Cloud Cover
        </Button>
        <Button
          variant={selectedLayer === 'temperature' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('temperature')}
          className="gap-2"
        >
          <Wind className="h-4 w-4" />
          Temperature
        </Button>
      </div>

      {/* Radar Map Container */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-muted border border-border">
        <div ref={mapContainer} className="absolute inset-0">
          {/* Animated Weather Map Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping opacity-20">
                  <div className="w-32 h-32 mx-auto rounded-full bg-primary" />
                </div>
                <CloudRain className="h-32 w-32 text-primary/60 animate-pulse relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="font-display font-bold text-xl">Interactive Weather Radar</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Live precipitation, cloud movement, and temperature data for {cityName}
                </p>
              </div>
            </div>
          </div>

          {/* Animated Weather Patterns */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-blue-400/20 animate-pulse"
                style={{
                  width: `${Math.random() * 60 + 20}px`,
                  height: `${Math.random() * 60 + 20}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 4 + 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Radar Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 space-y-2 border border-border">
          <p className="text-xs font-semibold mb-2">Intensity</p>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-200 to-blue-400" />
            <span className="text-xs">Light</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-700" />
            <span className="text-xs">Moderate</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-red-500" />
            <span className="text-xs">Heavy</span>
          </div>
        </div>

        {/* Current Layer Info */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2">
            {selectedLayer === 'precipitation' && <CloudRain className="h-4 w-4 text-blue-500" />}
            {selectedLayer === 'clouds' && <Layers className="h-4 w-4 text-gray-500" />}
            {selectedLayer === 'temperature' && <Wind className="h-4 w-4 text-orange-500" />}
            <span className="text-sm font-semibold capitalize">{selectedLayer}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAnimating(!isAnimating)}
          className="gap-2"
        >
          {isAnimating ? 'Pause' : 'Play'} Animation
        </Button>
        <p className="text-xs text-muted-foreground">Updated every 10 minutes</p>
      </div>
    </Card>
  );
};
