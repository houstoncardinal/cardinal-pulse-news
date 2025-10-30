import { useState, useEffect, useCallback, lazy, Suspense, memo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, TrendingDown, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// Lazy load heavy components
const StockTicker = lazy(() => import("@/components/StockTicker").then(m => ({ default: m.StockTicker })));
const AdvancedStockChart = lazy(() => import("@/components/stock/AdvancedStockChart").then(m => ({ default: m.AdvancedStockChart })));
const TechnicalIndicators = lazy(() => import("@/components/stock/TechnicalIndicators").then(m => ({ default: m.TechnicalIndicators })));
const MarketDepth = lazy(() => import("@/components/stock/MarketDepth").then(m => ({ default: m.MarketDepth })));
const StockNews = lazy(() => import("@/components/stock/StockNews").then(m => ({ default: m.StockNews })));

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface CompanyProfile {
  name: string;
  ticker: string;
  marketCapitalization: number;
  shareOutstanding: number;
  logo: string;
  weburl: string;
  exchange: string;
  ipo: string;
  country: string;
  currency: string;
  finnhubIndustry: string;
}

interface SearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

const MARKET_INDICES = ['SPY', 'QQQ', 'DIA', 'IWM'];
const TRENDING_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'];

const isValidStockQuote = (stock: any): stock is StockQuote => {
  return stock && 
    typeof stock.price === 'number' && 
    typeof stock.change === 'number' && 
    typeof stock.changePercent === 'number' &&
    typeof stock.high === 'number' &&
    typeof stock.low === 'number' &&
    typeof stock.open === 'number' &&
    typeof stock.previousClose === 'number';
};

// Memoized Stock Card Component
const StockCard = memo(({ stock, onClick }: { stock: StockQuote; onClick: () => void }) => {
  const isPositive = stock.change >= 0;
  
  return (
    <Card 
      className="luxury-card hover:scale-[1.02] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">${stock.price.toFixed(2)}</div>
        <div className={cn("flex items-center gap-1 text-sm font-medium", isPositive ? "text-success" : "text-destructive")}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>High: ${stock.high.toFixed(2)}</div>
          <div>Low: ${stock.low.toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  );
});

StockCard.displayName = 'StockCard';

const Stocks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [marketIndices, setMarketIndices] = useState<StockQuote[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<StockQuote[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>(["AAPL"]);
  const [stockProfile, setStockProfile] = useState<CompanyProfile | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized fetch functions
  const fetchMarketData = useCallback(async () => {
    try {
      const [indicesData, trendingData] = await Promise.all([
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: MARKET_INDICES, type: 'quote' }
        }),
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: TRENDING_STOCKS, type: 'quote' }
        })
      ]);

      if (indicesData.data?.quotes) {
        const validIndices = indicesData.data.quotes.filter(isValidStockQuote);
        setMarketIndices(validIndices);
      }
      if (trendingData.data?.quotes) {
        const validTrending = trendingData.data.quotes.filter(isValidStockQuote);
        setTrendingStocks(validTrending);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockDetails = useCallback(async (symbol: string) => {
    try {
      const [profileData, quoteData] = await Promise.all([
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: [symbol], type: 'profile' }
        }),
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: [symbol], type: 'quote' }
        })
      ]);

      if (profileData.data?.profile) setStockProfile(profileData.data.profile);
      if (quoteData.data?.quotes?.[0]) {
        const quote = quoteData.data.quotes[0];
        if (isValidStockQuote(quote)) {
          setStockQuote(quote);
        }
      }
    } catch (error) {
      console.error('Error fetching stock details:', error);
    }
  }, []);

  const searchStocks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols: [query.toUpperCase()], type: 'search' }
      });

      if (data?.results?.result) {
        const filtered = data.results.result
          .filter((r: SearchResult) => r.type === 'Common Stock')
          .slice(0, 10);
        setSearchResults(filtered);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const addStockToChart = useCallback((symbol: string) => {
    if (selectedStocks.length < 3 && !selectedStocks.includes(symbol)) {
      setSelectedStocks(prev => [...prev, symbol]);
    }
  }, [selectedStocks]);

  const removeStockFromChart = useCallback((symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s !== symbol));
  }, []);

  const handleStockClick = useCallback((symbol: string) => {
    setSelectedStocks([symbol]);
    fetchStockDetails(symbol);
  }, [fetchStockDetails]);

  // Effects
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchStockDetails(selectedStocks[0]);
    }
  }, [selectedStocks, fetchStockDetails]);

  useEffect(() => {
    searchStocks(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchStocks]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      {/* Stock Ticker */}
      <Suspense fallback={<div className="h-16 bg-muted/20 animate-pulse" />}>
        <StockTicker />
      </Suspense>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks (e.g., AAPL, TSLA, GOOGL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-lg"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute z-50 w-full mt-2 max-w-2xl mx-auto">
              <CardContent className="p-2">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => {
                      handleStockClick(result.symbol);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-sm text-muted-foreground truncate">{result.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Market Indices */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Market Indices
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketIndices.map(stock => (
                <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockClick(stock.symbol)} />
              ))}
            </div>
          )}
        </section>

        {/* Trending Stocks */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Stocks</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingStocks.map(stock => (
                <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockClick(stock.symbol)} />
              ))}
            </div>
          )}
        </section>

        {/* Selected Stocks Analysis */}
        {selectedStocks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold">Analysis Dashboard</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedStocks.map(symbol => (
                  <div key={symbol} className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                    <span className="font-medium">{symbol}</span>
                    {selectedStocks.length > 1 && (
                      <button onClick={() => removeStockFromChart(symbol)} className="hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {selectedStocks.length < 3 && (
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                )}
              </div>
            </div>

            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <AdvancedStockChart symbols={selectedStocks} />
            </Suspense>

            {selectedStocks.length === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<Skeleton className="h-96" />}>
                  <TechnicalIndicators symbol={selectedStocks[0]} />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-96" />}>
                  <MarketDepth symbol={selectedStocks[0]} />
                </Suspense>
              </div>
            )}

            {selectedStocks.length === 1 && (
              <Suspense fallback={<Skeleton className="h-96" />}>
                <StockNews symbol={selectedStocks[0]} />
              </Suspense>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Stocks;
