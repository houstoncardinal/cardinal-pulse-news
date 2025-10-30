import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnicalIndicatorsProps {
  symbol: string;
}

export const TechnicalIndicators = ({ symbol }: TechnicalIndicatorsProps) => {
  // Simulated technical indicators - in production, calculate from real data
  const indicators = [
    { name: 'RSI (14)', value: 65.4, signal: 'Neutral', trend: 'up' },
    { name: 'MACD (12,26)', value: 2.34, signal: 'Buy', trend: 'up' },
    { name: 'SMA (50)', value: 174.23, signal: 'Buy', trend: 'up' },
    { name: 'EMA (20)', value: 176.45, signal: 'Buy', trend: 'up' },
    { name: 'Bollinger Bands', value: 'Upper', signal: 'Overbought', trend: 'down' },
    { name: 'Stochastic', value: 72.1, signal: 'Neutral', trend: 'up' },
    { name: 'ADX (14)', value: 28.5, signal: 'Strong Trend', trend: 'up' },
    { name: 'ATR (14)', value: 3.21, signal: 'High Volatility', trend: 'up' },
  ];

  const getSignalColor = (signal: string) => {
    if (signal.includes('Buy') || signal.includes('Strong')) return 'text-green-500';
    if (signal.includes('Sell') || signal.includes('Weak')) return 'text-red-500';
    if (signal.includes('Overbought')) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Technical Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators.map((indicator) => (
            <div
              key={indicator.name}
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{indicator.name}</span>
                {indicator.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {typeof indicator.value === 'number' 
                    ? indicator.value.toFixed(2) 
                    : indicator.value}
                </span>
                <span className={cn("text-xs font-semibold", getSignalColor(indicator.signal))}>
                  {indicator.signal}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Signal */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Signal</p>
              <p className="text-2xl font-bold text-green-500">Strong Buy</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Confidence</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
