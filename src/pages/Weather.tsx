import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvancedWeatherWidget } from "@/components/weather/AdvancedWeatherWidget";
import { InteractiveWeatherRadar } from "@/components/weather/InteractiveWeatherRadar";
import { WeatherAlerts } from "@/components/weather/WeatherAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudSun, Radar, Bell } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Weather() {
  return (
    <>
      <Helmet>
        <title>Weather - Real-Time Forecasts & Radar | Cardinal News</title>
        <meta name="description" content="Get accurate weather forecasts, interactive radar, and severe weather alerts for your location." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">{/* Weather page */}
        <Header />
        
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-2">Weather Center</h1>
              <p className="text-muted-foreground">Real-time forecasts, interactive radar, and weather alerts</p>
            </div>

            <Tabs defaultValue="forecast" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
                <TabsTrigger value="forecast" className="gap-2">
                  <CloudSun className="h-4 w-4" />
                  Forecast
                </TabsTrigger>
                <TabsTrigger value="radar" className="gap-2">
                  <Radar className="h-4 w-4" />
                  Radar
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="forecast" className="space-y-6">
                <AdvancedWeatherWidget />
              </TabsContent>

              <TabsContent value="radar" className="space-y-6">
                <InteractiveWeatherRadar />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <WeatherAlerts cityName="Your Location" alerts={[]} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
