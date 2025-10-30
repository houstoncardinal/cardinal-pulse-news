import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Wind, Droplets, Eye, Gauge, Sunrise, Sunset, Loader2, Navigation } from "lucide-react";
import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    pressure: number;
    visibility: number;
    uvi: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    sunrise: number;
    sunset: number;
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
  }>;
  hourly: Array<{
    dt: number;
    temp: number;
    weather: Array<{
      main: string;
      icon: string;
    }>;
  }>;
}

interface LocationData {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const AdvancedWeatherWidget = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherData(latitude, longitude);
      },
      (error) => {
        setError("Unable to retrieve your location");
        setLoading(false);
        console.error("Geolocation error:", error);
      }
    );
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      // Fetch weather forecast
      const { data: forecastData, error: forecastError } = await supabase.functions.invoke(
        'fetch-weather-forecast',
        {
          body: { lat, lon }
        }
      );

      if (forecastError) throw forecastError;

      setWeather(forecastData);
      setLocation({
        city: forecastData.timezone?.split('/')[1] || 'Your Location',
        country: forecastData.timezone?.split('/')[0] || '',
        lat,
        lon
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  if (loading) {
    return (
      <Card className="luxury-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="luxury-card">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={getUserLocation}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !location) return null;

  const currentWeather = weather.current;
  const weeklyForecast = weather.daily.slice(0, 7);
  const hourlyForecast = weather.hourly.slice(0, 24);

  return (
    <div className="space-y-6">
      {/* Current Weather - Large Display */}
      <Card className="luxury-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{location.city}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={getUserLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Update Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Temperature Display */}
            <div className="flex items-center gap-6">
              <AnimatedWeatherIcon
                condition={currentWeather.weather[0].main}
                size="lg"
              />
              <div>
                <div className="text-7xl font-bold mb-2">
                  {Math.round(currentWeather.temp)}°
                </div>
                <p className="text-xl text-muted-foreground capitalize">
                  {currentWeather.weather[0].description}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Feels like {Math.round(currentWeather.feels_like)}°
                </p>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Wind className="h-4 w-4" />
                  <span className="text-sm">Wind</span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(currentWeather.wind_speed)} mph
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm">Humidity</span>
                </div>
                <p className="text-2xl font-bold">{currentWeather.humidity}%</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Gauge className="h-4 w-4" />
                  <span className="text-sm">Pressure</span>
                </div>
                <p className="text-2xl font-bold">{currentWeather.pressure} mb</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Visibility</span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(currentWeather.visibility / 1000)} km
                </p>
              </div>
            </div>
          </div>

          {/* Sun Times */}
          <div className="flex items-center justify-around mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-3">
              <Sunrise className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Sunrise</p>
                <p className="text-lg font-semibold">
                  {format(new Date(currentWeather.sunrise * 1000), 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sunset className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Sunset</p>
                <p className="text-lg font-semibold">
                  {format(new Date(currentWeather.sunset * 1000), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Forecast */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>24-Hour Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {hourlyForecast.map((hour, index) => (
              <div
                key={index}
                className="flex-shrink-0 p-4 rounded-lg bg-muted/50 min-w-[100px] text-center"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(hour.dt * 1000), 'ha')}
                </p>
                <AnimatedWeatherIcon
                  condition={hour.weather[0].main}
                  size="sm"
                />
                <p className="text-xl font-bold mt-2">
                  {Math.round(hour.temp)}°
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyForecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <p className="font-semibold w-24">
                    {index === 0 ? 'Today' : format(new Date(day.dt * 1000), 'EEEE')}
                  </p>
                  <AnimatedWeatherIcon
                    condition={day.weather[0].main}
                    size="sm"
                  />
                  <p className="text-sm text-muted-foreground capitalize flex-1">
                    {day.weather[0].description}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{Math.round(day.pop * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{Math.round(day.temp.min)}°</span>
                    <span className="font-bold text-xl">{Math.round(day.temp.max)}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
