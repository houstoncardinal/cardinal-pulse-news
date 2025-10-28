import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Major global cities for weather monitoring
const GLOBAL_CITIES = [
  { name: "New York", lat: 40.7128, lon: -74.0060, region: "North America" },
  { name: "London", lat: 51.5074, lon: -0.1278, region: "Europe" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, region: "Asia" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, region: "Oceania" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, region: "Middle East" },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, region: "South America" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, region: "Asia" },
  { name: "Paris", lat: 48.8566, lon: 2.3522, region: "Europe" },
  { name: "Beijing", lat: 39.9042, lon: 116.4074, region: "Asia" },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437, region: "North America" },
  { name: "Cairo", lat: 30.0444, lon: 31.2357, region: "Africa" },
  { name: "Moscow", lat: 55.7558, lon: 37.6173, region: "Europe" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, region: "Asia" },
  { name: "Mexico City", lat: 19.4326, lon: -99.1332, region: "North America" },
  { name: "Lagos", lat: 6.5244, lon: 3.3792, region: "Africa" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    const { cityName, coordinates } = await req.json().catch(() => ({}));

    // If specific city or coordinates requested
    if (cityName || coordinates) {
      let weatherData;
      
      if (coordinates) {
        const { lat, lon } = coordinates;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        weatherData = await weatherResponse.json();
      } else if (cityName) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        weatherData = await weatherResponse.json();
      }

      // Fetch forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${
        coordinates ? `lat=${coordinates.lat}&lon=${coordinates.lon}` : `q=${cityName}`
      }&units=metric&appid=${OPENWEATHER_API_KEY}`;
      
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();

      // Fetch air quality if coordinates available
      let airQualityData = null;
      const lat = weatherData.coord?.lat || coordinates?.lat;
      const lon = weatherData.coord?.lon || coordinates?.lon;
      
      if (lat && lon) {
        const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
        const airQualityResponse = await fetch(airQualityUrl);
        airQualityData = await airQualityResponse.json();
      }

      return new Response(
        JSON.stringify({
          success: true,
          current: weatherData,
          forecast: forecastData,
          airQuality: airQualityData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch weather for all global cities
    console.log('Fetching weather for all global cities...');
    
    const weatherPromises = GLOBAL_CITIES.map(async (city) => {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        return {
          ...city,
          weather: data,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error fetching weather for ${city.name}:`, error);
        return null;
      }
    });

    const weatherData = await Promise.all(weatherPromises);
    const validWeatherData = weatherData.filter(data => data !== null);

    // Store in database for caching and historical data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the data
    const { error: storageError } = await supabase
      .from('weather_data')
      .insert({
        data: validWeatherData,
        fetched_at: new Date().toISOString(),
      });

    if (storageError) {
      console.error('Error storing weather data:', storageError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cities: validWeatherData,
        totalCities: validWeatherData.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-global-weather function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
