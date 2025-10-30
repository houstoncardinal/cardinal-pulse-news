import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();
    
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    console.log(`🌤️ Fetching 7-day forecast for lat: ${lat}, lon: ${lon}`);

    // Fetch One Call API 3.0 for accurate 7-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!forecastResponse.ok) {
      // Fallback to 5 day / 3 hour forecast if One Call fails
      const fallbackResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const fallbackData = await fallbackResponse.json();
      
      // Process 5-day forecast into daily summaries
      const dailyForecasts: any[] = [];
      const groupedByDay: { [key: string]: any[] } = {};
      
      fallbackData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!groupedByDay[date]) {
          groupedByDay[date] = [];
        }
        groupedByDay[date].push(item);
      });

      Object.entries(groupedByDay).slice(0, 7).forEach(([date, items]) => {
        const temps = items.map((i: any) => i.main.temp);
        const conditions = items.map((i: any) => i.weather[0]);
        
        dailyForecasts.push({
          dt: new Date(date).getTime() / 1000,
          temp: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            day: temps.reduce((a: number, b: number) => a + b, 0) / temps.length
          },
          weather: [conditions[Math.floor(conditions.length / 2)]],
          humidity: items[Math.floor(items.length / 2)].main.humidity,
          wind_speed: items[Math.floor(items.length / 2)].wind.speed,
          pop: Math.max(...items.map((i: any) => i.pop || 0)),
          hourly: items.slice(0, 8).map((h: any) => ({
            dt: h.dt,
            temp: h.main.temp,
            weather: h.weather,
            pop: h.pop || 0
          }))
        });
      });

      return new Response(
        JSON.stringify({
          success: true,
          current: fallbackData.list[0],
          daily: dailyForecasts,
          hourly: fallbackData.list.slice(0, 24),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const forecastData = await forecastResponse.json();

    console.log(`✓ Successfully fetched 7-day forecast`);

    return new Response(
      JSON.stringify({
        success: true,
        current: forecastData.current,
        daily: forecastData.daily.slice(0, 7),
        hourly: forecastData.hourly.slice(0, 24),
        alerts: forecastData.alerts || [],
        source: 'onecall'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-weather-forecast:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
