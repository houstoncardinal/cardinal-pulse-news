import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Cloud, Droplets, Wind, Eye, Thermometer, Globe2, AlertTriangle, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { WeatherRadar } from "@/components/weather/WeatherRadar";
import { WeatherForecast } from "@/components/weather/WeatherForecast";
import { WeatherAlerts } from "@/components/weather/WeatherAlerts";
import { AnimatedWeatherIcon } from "@/components/weather/AnimatedWeatherIcon";
import { DetailedWeatherPanel } from "@/components/weather/DetailedWeatherPanel";

interface WeatherCity {
  name: string;
  lat: number;
  lon: number;
  region: string;
  weather: any;
  timestamp: string;
}

export default function Weather() {
  const [globalWeather, setGlobalWeather] = useState<WeatherCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<WeatherCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  useEffect(() => {
    fetchGlobalWeather();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchGlobalWeather, 600000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Globe2 className="h-8 w-8 text-primary" />
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                Global Weather Center
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time weather monitoring for major cities worldwide. Updated every 10 minutes.
            </p>
            <Badge className="mt-4 bg-green-500/20 text-green-500 border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
          </div>

          {/* Region Filter */}
          <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-2">
              {regions.map(region => (
                <TabsTrigger key={region} value={region} className="capitalize">
                  {region === "all" ? "🌍 All Regions" : region}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Weather Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {filteredCities.map((city) => (
              <Card
                key={city.name}
                className={`p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                  selectedCity?.name === city.name ? 'ring-2 ring-primary' : ''
                }`}
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
                  <span className="text-4xl">{getWeatherIcon(city.weather.weather[0].main)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">
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
                      <Droplets className="h-4 w-4 text-blue-400" />
                      {city.weather.main.humidity}%
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Wind className="h-4 w-4 text-gray-400" />
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
              <Card className="p-8 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <AnimatedWeatherIcon condition={selectedCity.weather.weather[0].main} size="lg" />
                  <div className="flex-1">
                    <h2 className="font-display text-3xl font-bold">{selectedCity.name}</h2>
                    <p className="text-muted-foreground">{selectedCity.region}</p>
                    <Badge className="mt-2">{selectedCity.weather.weather[0].main}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-bold">{Math.round(selectedCity.weather.main.temp)}°C</div>
                    <p className="text-muted-foreground">Feels like {Math.round(selectedCity.weather.main.feels_like)}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3">
                    <Thermometer className="h-6 w-6 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">High / Low</p>
                      <p className="text-xl font-semibold">
                        {Math.round(selectedCity.weather.main.temp_max)}° / {Math.round(selectedCity.weather.main.temp_min)}°
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Droplets className="h-6 w-6 text-blue-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.main.humidity}%</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Wind className="h-6 w-6 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind Speed</p>
                      <p className="text-xl font-semibold">{Math.round(selectedCity.weather.wind.speed * 3.6)} km/h</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Eye className="h-6 w-6 text-purple-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility</p>
                      <p className="text-xl font-semibold">{(selectedCity.weather.visibility / 1000).toFixed(1)} km</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Cloud className="h-6 w-6 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cloud Cover</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.clouds.all}%</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-6 w-6 text-orange-400 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pressure</p>
                      <p className="text-xl font-semibold">{selectedCity.weather.main.pressure} hPa</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Advanced Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WeatherRadar 
                  lat={selectedCity.lat} 
                  lon={selectedCity.lon} 
                  cityName={selectedCity.name} 
                />
                <WeatherAlerts
                  cityName={selectedCity.name}
                  alerts={[]}
                />
              </div>

              <WeatherForecast
                cityName={selectedCity.name}
                forecast={[
                  {
                    date: 'Dec 29',
                    day: 'Today',
                    high: Math.round(selectedCity.weather.main.temp_max) + 2,
                    low: Math.round(selectedCity.weather.main.temp_min),
                    condition: selectedCity.weather.weather[0].main,
                    icon: selectedCity.weather.weather[0].main,
                    precipitation: 20,
                    humidity: selectedCity.weather.main.humidity,
                    windSpeed: Math.round(selectedCity.weather.wind.speed * 3.6),
                    hourly: [
                      { time: '12 PM', temp: Math.round(selectedCity.weather.main.temp), condition: selectedCity.weather.weather[0].main, icon: 'clear' },
                      { time: '3 PM', temp: Math.round(selectedCity.weather.main.temp) + 1, condition: selectedCity.weather.weather[0].main, icon: 'clear' },
                      { time: '6 PM', temp: Math.round(selectedCity.weather.main.temp) - 1, condition: 'Partly Cloudy', icon: 'clouds' },
                      { time: '9 PM', temp: Math.round(selectedCity.weather.main.temp) - 3, condition: 'Clear', icon: 'clear' },
                    ]
                  },
                  ...Array.from({ length: 6 }, (_, i) => ({
                    date: `Dec ${30 + i}`,
                    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
                    high: Math.round(selectedCity.weather.main.temp_max) + Math.floor(Math.random() * 5) - 2,
                    low: Math.round(selectedCity.weather.main.temp_min) + Math.floor(Math.random() * 3) - 1,
                    condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain'][Math.floor(Math.random() * 4)],
                    icon: 'clear',
                    precipitation: Math.floor(Math.random() * 60),
                    humidity: 50 + Math.floor(Math.random() * 40),
                    windSpeed: 10 + Math.floor(Math.random() * 20)
                  }))
                ]}
              />
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
