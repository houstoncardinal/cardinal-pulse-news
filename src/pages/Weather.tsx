import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Droplets, Wind, Eye, Thermometer, Globe2, AlertTriangle, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { WeatherRadar } from "@/components/weather/WeatherRadar";
import { WeatherForecast } from "@/components/weather/WeatherForecast";
import { WeatherAlerts } from "@/components/weather/WeatherAlerts";
import { AnimatedWeatherIcon } from "@/components/weather/AnimatedWeatherIcon";
import { DetailedWeatherPanel } from "@/components/weather/DetailedWeatherPanel";
import { toast } from "sonner";

interface WeatherCity {
  name: string;
  lat: number;
  lon: number;
  region: string;
  weather: any;
  timestamp: string;
  isUserLocation?: boolean;
}

export default function Weather() {
  const [globalWeather, setGlobalWeather] = useState<WeatherCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<WeatherCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [weeklyForecast, setWeeklyForecast] = useState<any>(null);

  useEffect(() => {
    fetchGlobalWeather();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchGlobalWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchWeeklyForecast(selectedCity.lat, selectedCity.lon);
    }
  }, [selectedCity]);

  const getUserLocation = async () => {
    setLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          // Fetch weather for user location
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const userCity: WeatherCity = {
              name: data.name || "Your Location",
              lat: latitude,
              lon: longitude,
              region: "Your Location",
              weather: data,
              timestamp: new Date().toISOString(),
              isUserLocation: true
            };
            
            setGlobalWeather(prev => [userCity, ...prev.filter(c => !c.isUserLocation)]);
            setSelectedCity(userCity);
            toast.success(`Showing weather for your location: ${data.name}`);
          }
          
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Unable to get your location. Please enable location access.");
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error("Failed to get your location");
      setLoadingLocation(false);
    }
  };

  const fetchWeeklyForecast = async (lat: number, lon: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-weather-forecast', {
        body: { lat, lon }
      });

      if (error) throw error;

      if (data?.success) {
        setWeeklyForecast(data);
      }
    } catch (error) {
      console.error('Error fetching weekly forecast:', error);
    }
  };

  const fetchGlobalWeather = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-global-weather', {
        body: {},
      });

      if (error) throw error;

      if (data?.success && data?.cities) {
        setGlobalWeather(data.cities);
        if (!selectedCity && data.cities.length > 0) {
          setSelectedCity(data.cities[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const regions = ["all", ...Array.from(new Set(globalWeather.map(c => c.region)))];
  const filteredCities = selectedRegion === "all" 
    ? globalWeather 
    : globalWeather.filter(c => c.region === selectedRegion);

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('clear')) return '☀️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const getAirQualityColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    return 'bg-purple-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading global weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Global Weather - Real-Time Weather Updates | Cardinal News</title>
        <meta name="description" content="Track real-time weather conditions worldwide with interactive maps, radar, and forecasts from Cardinal News." />
        <meta property="og:title" content="Global Weather - Real-Time Updates" />
        <meta property="og:description" content="Live weather tracking for major cities worldwide" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-6 sm:mb-8 text-center px-2">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <Globe2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold">
                Global Weather Center
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-4">
              Real-time weather monitoring for major cities worldwide. Updated every 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-3 sm:mt-4">
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
              <Button
                onClick={getUserLocation}
                disabled={loadingLocation}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {loadingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Use My Location
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Region Filter */}
          <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="mb-8">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-7 gap-2">
                {regions.map(region => (
                  <TabsTrigger 
                    key={region} 
                    value={region} 
                    className="capitalize whitespace-nowrap px-4 sm:px-6"
                  >
                    {region === "all" ? "🌍 All" : region}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Weather Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {filteredCities.map((city, index) => (
              <Card
                key={city.name}
                className={`p-6 cursor-pointer transition-all hover-lift hover-glow animate-reveal-scale ${
                  selectedCity?.name === city.name ? 'ring-2 ring-primary animate-pulse-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  setSelectedCity(city);
                  setShowDetailPanel(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-xl">{city.name}</h3>
                    <p className="text-xs text-muted-foreground">{city.region}</p>
                  </div>
                  <div className="animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <AnimatedWeatherIcon condition={city.weather.weather[0].main} size="sm" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                      {Math.round(city.weather.main.temp)}°C
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Feels {Math.round(city.weather.main.feels_like)}°C
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground capitalize">
                    {city.weather.weather[0].description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs">
                      <Droplets className="h-4 w-4 text-blue-400 animate-pulse" />
                      {city.weather.main.humidity}%
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Wind className="h-4 w-4 text-gray-400 animate-pulse" />
                      {Math.round(city.weather.wind.speed * 3.6)} km/h
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Detailed View */}
          {selectedCity && (
            <>
              <Card className="p-8 mb-6 animate-reveal-from-bottom hover-lift">
                <div className="flex items-center gap-4 mb-6">
                  <div className="animate-bounce-in">
                    <AnimatedWeatherIcon condition={selectedCity.weather.weather[0].main} size="lg" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-3xl font-bold animate-fade-in">{selectedCity.name}</h2>
                    <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>{selectedCity.region}</p>
                    <Badge className="mt-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>{selectedCity.weather.weather[0].main}</Badge>
                  </div>
                  <div className="text-right animate-reveal-scale">
                    <div className="text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                      {Math.round(selectedCity.weather.main.temp)}°C
                    </div>
                    <p className="text-muted-foreground">Feels like {Math.round(selectedCity.weather.main.feels_like)}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <Thermometer className="h-6 w-6 text-red-400 mt-1 animate-pulse" />
                    <div>
                      <p className="text-sm text-muted-foreground">High / Low</p>
                      <p className="text-xl font-semibold">
                        {Math.round(selectedCity.weather.main.temp_max)}° / {Math.round(selectedCity.weather.main.temp_min)}°
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <Droplets className="h-6 w-6 text-blue-400 mt-1 animate-pulse" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.main.humidity}%</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Wind className="h-6 w-6 text-gray-400 mt-1 animate-pulse" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind Speed</p>
                      <p className="text-xl font-semibold">{Math.round(selectedCity.weather.wind.speed * 3.6)} km/h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <Eye className="h-6 w-6 text-purple-400 mt-1 animate-pulse" />
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility</p>
                      <p className="text-xl font-semibold">{(selectedCity.weather.visibility / 1000).toFixed(1)} km</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <Cloud className="h-6 w-6 text-gray-400 mt-1 animate-cloud-drift" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cloud Cover</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.clouds.all}%</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <TrendingUp className="h-6 w-6 text-orange-400 mt-1 animate-pulse" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pressure</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.main.pressure} hPa</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Advanced Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-reveal-from-bottom" style={{ animationDelay: '0.3s' }}>
                <div className="hover-lift">
                  <WeatherRadar 
                    lat={selectedCity.lat} 
                    lon={selectedCity.lon} 
                    cityName={selectedCity.name} 
                  />
                </div>
                <div className="hover-lift">
                  <WeatherAlerts
                    cityName={selectedCity.name}
                    alerts={[]}
                  />
                </div>
              </div>

              <div className="animate-reveal-from-bottom" style={{ animationDelay: '0.4s' }}>
                <WeatherForecast
                  cityName={selectedCity.name}
                  forecast={weeklyForecast?.daily ? weeklyForecast.daily.map((day: any, i: number) => ({
                    date: new Date(day.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    day: i === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                    high: Math.round(day.temp.max),
                    low: Math.round(day.temp.min),
                    condition: day.weather[0].main,
                    icon: day.weather[0].main,
                    precipitation: Math.round((day.pop || 0) * 100),
                    humidity: day.humidity,
                    windSpeed: Math.round(day.wind_speed * 3.6),
                    hourly: day.hourly?.slice(0, 8).map((hour: any) => ({
                      time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                      temp: Math.round(hour.temp),
                      condition: hour.weather[0].main,
                      icon: hour.weather[0].main.toLowerCase()
                    })) || []
                  })) : [
                    {
                      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      day: 'Today',
                      high: Math.round(selectedCity.weather.main.temp_max) + 2,
                      low: Math.round(selectedCity.weather.main.temp_min),
                      condition: selectedCity.weather.weather[0].main,
                      icon: selectedCity.weather.weather[0].main,
                      precipitation: 20,
                      humidity: selectedCity.weather.main.humidity,
                      windSpeed: Math.round(selectedCity.weather.wind.speed * 3.6),
                      hourly: []
                    }
                  ]}
                />
              </div>
            </>
          )}
        </main>

        <Footer />
        <MobileToolbar />
        
        {/* Detailed Weather Panel */}
        {showDetailPanel && selectedCity && (
          <DetailedWeatherPanel
            city={selectedCity}
            onClose={() => setShowDetailPanel(false)}
          />
        )}
      </div>
    </>
  );
}
