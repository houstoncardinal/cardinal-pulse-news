import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CloudRain, Wind, Snowflake, Zap, Info } from "lucide-react";

interface WeatherAlert {
  id: string;
  type: 'severe' | 'moderate' | 'info';
  title: string;
  description: string;
  icon: string;
  startTime: string;
  endTime: string;
}

interface WeatherAlertsProps {
  cityName: string;
  alerts: WeatherAlert[];
}

export const WeatherAlerts = ({ cityName, alerts }: WeatherAlertsProps) => {
  const getAlertIcon = (icon: string) => {
    switch (icon) {
      case 'rain':
        return <CloudRain className="h-5 w-5" />;
      case 'wind':
        return <Wind className="h-5 w-5" />;
      case 'snow':
        return <Snowflake className="h-5 w-5" />;
      case 'storm':
        return <Zap className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'severe':
        return 'border-red-500 bg-red-500/5';
      case 'moderate':
        return 'border-orange-500 bg-orange-500/5';
      default:
        return 'border-blue-500 bg-blue-500/5';
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'severe':
        return <Badge className="bg-red-500">Severe Warning</Badge>;
      case 'moderate':
        return <Badge className="bg-orange-500">Advisory</Badge>;
      default:
        return <Badge className="bg-blue-500">Information</Badge>;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Info className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Weather Alerts</h3>
            <p className="text-sm text-muted-foreground">{cityName}</p>
          </div>
        </div>
        <Alert className="border-green-500 bg-green-500/5">
          <AlertDescription className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <span className="font-medium">No active weather alerts. Conditions are normal.</span>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Active Weather Alerts</h3>
          <p className="text-sm text-muted-foreground">{cityName} - {alerts.length} Active</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} className={`${getAlertColor(alert.type)} border-2`}>
            <div className="flex items-start gap-4">
              <div className="mt-1">{getAlertIcon(alert.icon)}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  {getAlertBadge(alert.type)}
                </div>
                <AlertDescription className="text-sm">
                  {alert.description}
                </AlertDescription>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <span>⏰ From: {alert.startTime}</span>
                  <span>Until: {alert.endTime}</span>
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
};
