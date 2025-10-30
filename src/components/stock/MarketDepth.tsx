import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketDepthProps {
  symbol: string;
}

interface OrderBookEntry {
  price: number;
  volume: number;
  total: number;
}

export const MarketDepth = ({ symbol }: MarketDepthProps) => {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState({ amount: 0, percentage: 0 });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Generate realistic market depth data
  const generateMarketDepth = (basePrice: number = 150) => {
    const newBids: OrderBookEntry[] = [];
    const newAsks: OrderBookEntry[] = [];

    // Generate bids (buy orders) below current price
    let bidTotal = 0;
    for (let i = 0; i < 8; i++) {
      const price = basePrice - (i + 1) * 0.05;
      const volume = Math.floor(Math.random() * 5000) + 500;
      bidTotal += volume;
      newBids.push({
        price: Math.round(price * 100) / 100,
        volume,
        total: bidTotal
      });
    }

    // Generate asks (sell orders) above current price
    let askTotal = 0;
    for (let i = 0; i < 8; i++) {
      const price = basePrice + (i + 1) * 0.05;
      const volume = Math.floor(Math.random() * 5000) + 500;
      askTotal += volume;
      newAsks.push({
        price: Math.round(price * 100) / 100,
        volume,
        total: askTotal
      });
    }

    setBids(newBids);
    setAsks(newAsks);

    // Calculate spread
    const bestBid = newBids[0]?.price || basePrice;
    const bestAsk = newAsks[0]?.price || basePrice;
    const spreadAmount = bestAsk - bestBid;
    const spreadPercentage = (spreadAmount / bestBid) * 100;

    setSpread({
      amount: Math.round(spreadAmount * 100) / 100,
      percentage: Math.round(spreadPercentage * 100) / 100
    });

    setLastUpdate(new Date());
  };

  useEffect(() => {
    generateMarketDepth();

    // Update market depth every 30 seconds
    const interval = setInterval(() => {
      generateMarketDepth();
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol]);

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
              <span className="text-lg font-bold">${spread.amount.toFixed(2)} ({spread.percentage.toFixed(2)}%)</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMarketDepth()}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <span className="text-xs text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
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
