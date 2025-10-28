import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Globe2, ArrowRight, Thermometer, Wind, Droplets } from "lucide-react";
import { Link } from "react-router-dom";

interface WeatherCity {
  name: string;
  region: string;
  weather: any;
}

export const WeatherWidget = () => {
  const [cities, setCities] = useState<WeatherCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-global-weather');
      
      if (error) throw error;
      
      if (data?.success && data?.cities) {
        // Show top 6 cities
        setCities(data.cities.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('clear')) return '☀️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('storm')) return '⛈️';
    return '🌤️';
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Globe2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe2 className="h-8 w-8 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Global Weather
              </h2>
            </div>
            <p className="text-muted-foreground">
              Real-time weather conditions worldwide
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link to="/weather" className="gap-2">
              View All Cities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cities.map((city) => (
            <Card key={city.name} className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-xl">{city.name}</h3>
                  <p className="text-xs text-muted-foreground">{city.region}</p>
                </div>
                <span className="text-4xl">{getWeatherIcon(city.weather.weather[0].main)}</span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold">
                  {Math.round(city.weather.main.temp)}°C
                </span>
                <span className="text-sm text-muted-foreground">
                  feels {Math.round(city.weather.main.feels_like)}°
                </span>
              </div>

              <p className="text-sm capitalize mb-4 text-foreground/80">
                {city.weather.weather[0].description}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div className="text-center">
                  <Thermometer className="h-4 w-4 mx-auto mb-1 text-red-400" />
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="text-sm font-semibold">{Math.round(city.weather.main.temp_max)}°</p>
                </div>
                <div className="text-center">
                  <Droplets className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                  <p className="text-xs text-muted-foreground">Humid</p>
                  <p className="text-sm font-semibold">{city.weather.main.humidity}%</p>
                </div>
                <div className="text-center">
                  <Wind className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-sm font-semibold">{Math.round(city.weather.wind.speed * 3.6)} km/h</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center md:hidden">
          <Button variant="outline" asChild className="w-full">
            <Link to="/weather" className="gap-2">
              View All Cities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live Updates Every 10 Minutes
          </Badge>
        </div>
      </div>
    </section>
  );
};
