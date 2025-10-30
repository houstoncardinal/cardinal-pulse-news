import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const POPULAR_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT', 'DIS', 'NFLX', 'AMD', 'INTC', 'BA'];

export const StockTicker = () => {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate mock stock data for demo
  const generateMockStocks = (): StockQuote[] => {
    return POPULAR_STOCKS.map((symbol, index) => {
      const basePrice = 100 + index * 20 + Math.random() * 50;
      const change = (Math.random() - 0.5) * 10;
      const changePercent = (change / basePrice) * 100;

      return {
        symbol,
        price: Math.round(basePrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      };
    });
  };

  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: {
          symbols: POPULAR_STOCKS,
          type: 'quote'
        }
      });

      if (error) {
        console.error('Error fetching stock data:', error);
        // Fall back to mock data
        setStocks(generateMockStocks());
      } else if (data?.quotes) {
        // Filter out quotes without complete data
        const validQuotes = data.quotes.filter((q: StockQuote) =>
          q.price != null && q.change != null && q.changePercent != null
        );

        if (validQuotes.length > 0) {
          setStocks(validQuotes);
        } else {
          // Fall back to mock data if no valid quotes
          setStocks(generateMockStocks());
        }
      } else {
        // Fall back to mock data
        setStocks(generateMockStocks());
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Fall back to mock data
      setStocks(generateMockStocks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStockData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-background/95 backdrop-blur-xl border-y border-white/10 py-3 overflow-hidden">
        <div className="flex items-center gap-8 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-12 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show loading state if no valid stocks yet
  if (stocks.length === 0) {
    return (
      <div className="bg-background/95 backdrop-blur-xl border-y border-white/10 py-3 overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          Loading market data...
        </div>
      </div>
    );
  }

  // Duplicate stocks array for seamless loop
  const displayStocks = [...stocks, ...stocks];

  return (
    <div className="bg-gradient-to-r from-background/95 via-primary/5 to-background/95 backdrop-blur-xl border-y border-white/10 py-3 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative flex animate-scroll hover:pause-animation">
        {displayStocks.map((stock, index) => (
          <div
            key={`${stock.symbol}-${index}`}
            className="flex items-center gap-3 px-6 whitespace-nowrap"
          >
            <span className="font-bold text-sm text-foreground">{stock.symbol}</span>
            <span className="text-sm font-semibold text-foreground">
              ${stock.price.toFixed(2)}
            </span>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              stock.change >= 0 
                ? "bg-green-500/20 text-green-500" 
                : "bg-red-500/20 text-red-500"
            )}>
              {stock.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
