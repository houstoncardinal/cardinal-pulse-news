import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MarketDepthProps {
  symbol: string;
}

export const MarketDepth = ({ symbol }: MarketDepthProps) => {
  // Simulated market depth data
  const bids = [
    { price: 175.20, volume: 2500, total: 2500 },
    { price: 175.15, volume: 1800, total: 4300 },
    { price: 175.10, volume: 3200, total: 7500 },
    { price: 175.05, volume: 1500, total: 9000 },
    { price: 175.00, volume: 2100, total: 11100 },
  ];

  const asks = [
    { price: 175.25, volume: 1900, total: 1900 },
    { price: 175.30, volume: 2200, total: 4100 },
    { price: 175.35, volume: 1600, total: 5700 },
    { price: 175.40, volume: 2800, total: 8500 },
    { price: 175.45, volume: 1400, total: 9900 },
  ];

  const maxVolume = Math.max(...bids.map(b => b.volume), ...asks.map(a => a.volume));

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Market Depth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Asks */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-red-500">Asks (Sell Orders)</h4>
            <div className="space-y-2">
              {asks.reverse().map((ask, index) => (
                <div key={index} className="relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded" 
                       style={{ width: `${(ask.volume / maxVolume) * 100}%` }} />
                  <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono text-red-500">${ask.price.toFixed(2)}</span>
                    <span className="font-mono">{ask.volume.toLocaleString()}</span>
                    <span className="font-mono text-muted-foreground">{ask.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spread */}
          <div className="py-3 px-4 bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-lg border border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Spread</span>
              <span className="text-lg font-bold">$0.05 (0.03%)</span>
            </div>
          </div>

          {/* Bids */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-green-500">Bids (Buy Orders)</h4>
            <div className="space-y-2">
              {bids.map((bid, index) => (
                <div key={index} className="relative">
                  <div className="absolute inset-0 bg-green-500/10 rounded" 
                       style={{ width: `${(bid.volume / maxVolume) * 100}%` }} />
                  <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-mono text-green-500">${bid.price.toFixed(2)}</span>
                    <span className="font-mono">{bid.volume.toLocaleString()}</span>
                    <span className="font-mono text-muted-foreground">{bid.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
