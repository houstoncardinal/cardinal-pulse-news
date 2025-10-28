import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ForecastDay {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  hourly?: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
  }>;
}

interface WeatherForecastProps {
  cityName: string;
  forecast: ForecastDay[];
}

export const WeatherForecast = ({ cityName, forecast }: WeatherForecastProps) => {
  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('clear')) return '☀️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous + 2) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (current < previous - 2) return <TrendingDown className="h-3 w-3 text-blue-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">7-Day Forecast</h3>
            <p className="text-sm text-muted-foreground">{cityName}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="h-3 w-3" />
          Hourly & Daily
        </Badge>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Forecast</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-3 mt-4">
          {forecast.map((day, index) => (
            <div
              key={day.date}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-semibold">{day.day}</p>
                  <p className="text-xs text-muted-foreground">{day.date}</p>
                </div>
                
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-4xl">{getWeatherIcon(day.condition)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{day.condition}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        💧 {day.precipitation}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        💨 {day.windSpeed} km/h
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{day.high}°</span>
                    {index > 0 && getTrendIcon(day.high, forecast[index - 1].high)}
                  </div>
                  <span className="text-sm text-muted-foreground">{day.low}°</span>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {forecast[0]?.hourly?.map((hour, index) => (
              <Card key={index} className="p-4 text-center space-y-2 hover:shadow-lg transition-shadow">
                <p className="text-sm font-semibold">{hour.time}</p>
                <span className="text-3xl block">{getWeatherIcon(hour.condition)}</span>
                <p className="text-2xl font-bold">{hour.temp}°</p>
                <p className="text-xs text-muted-foreground capitalize">{hour.condition}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
