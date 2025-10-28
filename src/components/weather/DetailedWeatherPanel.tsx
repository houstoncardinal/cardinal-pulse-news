import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  Sunrise, 
  Sunset,
  Cloud,
  Navigation,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";

interface WeatherCity {
  name: string;
  lat: number;
  lon: number;
  region: string;
  weather: any;
  timestamp: string;
}

interface DetailedWeatherPanelProps {
  city: WeatherCity;
  onClose: () => void;
}

export const DetailedWeatherPanel = ({ city, onClose }: DetailedWeatherPanelProps) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getUVIndex = () => {
    // Mock UV index based on time of day and cloud cover
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour <= 18;
    const cloudiness = city.weather.clouds.all;
    
    if (!isDay) return { value: 0, level: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' };
    
    const baseUV = 7 - (cloudiness / 20);
    if (baseUV <= 2) return { value: Math.round(baseUV), level: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (baseUV <= 5) return { value: Math.round(baseUV), level: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (baseUV <= 7) return { value: Math.round(baseUV), level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { value: Math.round(baseUV), level: 'Very High', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const getAirQuality = () => {
    // Mock air quality
    const aqi = Math.floor(Math.random() * 100) + 20;
    if (aqi <= 50) return { value: aqi, level: 'Good', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (aqi <= 100) return { value: aqi, level: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (aqi <= 150) return { value: aqi, level: 'Unhealthy', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { value: aqi, level: 'Hazardous', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const uvIndex = getUVIndex();
  const airQuality = getAirQuality();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 shadow-2xl">
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <AnimatedWeatherIcon condition={city.weather.weather[0].main} size="lg" />
            <div>
              <h2 className="font-display text-3xl font-bold">{city.name}</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <span>{city.region}</span>
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3 animate-pulse" />
                  Live
                </Badge>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-primary/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Temperature Display */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-7xl font-bold">{Math.round(city.weather.main.temp)}°</span>
                <span className="text-2xl text-muted-foreground">C</span>
              </div>
              <p className="text-xl capitalize text-foreground/80">
                {city.weather.weather[0].description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Feels like {Math.round(city.weather.main.feels_like)}°C
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-red-400" />
                <span>High: {Math.round(city.weather.main.temp_max)}°</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-blue-400" />
                <span>Low: {Math.round(city.weather.main.temp_min)}°</span>
              </div>
            </div>
          </div>

          {/* Detailed Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Humidity */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Droplets className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold">{city.weather.main.humidity}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${city.weather.main.humidity}%` }}
                />
              </div>
            </Card>

            {/* Wind Speed */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Wind className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold">
                  {Math.round(city.weather.wind.speed * 3.6)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Wind Speed</p>
              <p className="text-xs text-muted-foreground mt-1">
                km/h {getWindDirection(city.weather.wind.deg)}
              </p>
            </Card>

            {/* Visibility */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Eye className="h-5 w-5 text-purple-400" />
                <span className="text-2xl font-bold">
                  {(city.weather.visibility / 1000).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Visibility</p>
              <p className="text-xs text-muted-foreground mt-1">kilometers</p>
            </Card>

            {/* Pressure */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Gauge className="h-5 w-5 text-orange-400" />
                <span className="text-2xl font-bold">{city.weather.main.pressure}</span>
              </div>
              <p className="text-sm text-muted-foreground">Pressure</p>
              <p className="text-xs text-muted-foreground mt-1">hPa</p>
            </Card>

            {/* Cloud Cover */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Cloud className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold">{city.weather.clouds.all}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Cloud Cover</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full transition-all duration-500"
                  style={{ width: `${city.weather.clouds.all}%` }}
                />
              </div>
            </Card>

            {/* Wind Direction */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Navigation 
                  className="h-5 w-5 text-cyan-400 transition-transform duration-500" 
                  style={{ transform: `rotate(${city.weather.wind.deg}deg)` }}
                />
                <span className="text-2xl font-bold">{city.weather.wind.deg}°</span>
              </div>
              <p className="text-sm text-muted-foreground">Wind Direction</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getWindDirection(city.weather.wind.deg)}
              </p>
            </Card>
          </div>

          {/* Sun Times */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Sunrise className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sunrise</p>
                  <p className="text-2xl font-bold">{formatTime(city.weather.sys.sunrise)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sunset className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sunset</p>
                  <p className="text-2xl font-bold">{formatTime(city.weather.sys.sunset)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className={`p-5 ${uvIndex.bg} border-${uvIndex.color.split('-')[1]}-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">UV Index</p>
                <Badge className={uvIndex.color}>{uvIndex.level}</Badge>
              </div>
              <p className="text-3xl font-bold">{uvIndex.value}</p>
            </Card>

            <Card className={`p-5 ${airQuality.bg} border-${airQuality.color.split('-')[1]}-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Air Quality</p>
                <Badge className={airQuality.color}>{airQuality.level}</Badge>
              </div>
              <p className="text-3xl font-bold">{airQuality.value}</p>
            </Card>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>Last updated: {new Date(city.timestamp).toLocaleString()}</p>
            <p className="text-xs mt-1">Data refreshes every 10 minutes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
