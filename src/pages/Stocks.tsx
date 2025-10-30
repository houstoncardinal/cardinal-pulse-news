import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StockTicker } from "@/components/StockTicker";
import { AdvancedStockChart } from "@/components/stock/AdvancedStockChart";
import { TechnicalIndicators } from "@/components/stock/TechnicalIndicators";
import { MarketDepth } from "@/components/stock/MarketDepth";
import { StockNews } from "@/components/stock/StockNews";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3, LineChart, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

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

// Helper function to check if stock data is complete
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

  const fetchMarketData = async () => {
    try {
      const [indicesData, trendingData] = await Promise.all([
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: MARKET_INDICES, type: 'quote' }
        }),
        supabase.functions.invoke('fetch-stock-data', {
          body: { symbols: TRENDING_STOCKS, type: 'quote' }
        })
      ]);

      // Filter out stocks with incomplete data
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
  };

  const fetchStockDetails = async (symbol: string) => {
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
        // Only set if data is valid
        if (isValidStockQuote(quote)) {
          setStockQuote(quote);
        }
      }
    } catch (error) {
      console.error('Error fetching stock details:', error);
    }
  };

  const searchStocks = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { query, type: 'search' }
      });

      if (error) throw error;
      
      if (data?.results) {
        setSearchResults(data.results.slice(0, 10));
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const addStockToChart = (symbol: string) => {
    if (!selectedStocks.includes(symbol) && selectedStocks.length < 3) {
      setSelectedStocks([...selectedStocks, symbol]);
    }
    setSearchQuery("");
    setShowSearchResults(false);
    fetchStockDetails(symbol);
  };

  const removeStockFromChart = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== symbol));
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchStockDetails(selectedStocks[0]);
    }
  }, [selectedStocks]);

  useEffect(() => {
    searchStocks(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchStocks]);

  const handleStockClick = (symbol: string) => {
    setSelectedStocks([symbol]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <Header />
      
      <StockTicker />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Stock Market Center
              </h1>
              <p className="text-muted-foreground">Real-time market data and analysis</p>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            )}
            <Input
              placeholder="Search stocks by symbol or company name... (e.g., AAPL, Tesla)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="pl-10 pr-10 h-12 bg-background/50 backdrop-blur-xl border-white/10 text-base"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
                <CardContent className="p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => addStockToChart(result.symbol)}
                      className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-sm">{result.displaySymbol}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{result.description}</div>
                      </div>
                      <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selected Stocks Pills */}
          {selectedStocks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedStocks.map((symbol) => (
                <div
                  key={symbol}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full"
                >
                  <span className="font-bold text-sm">{symbol}</span>
                  {selectedStocks.length > 1 && (
                    <button
                      onClick={() => removeStockFromChart(symbol)}
                      className="hover:bg-destructive/20 rounded-full p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {selectedStocks.length < 3 && (
                <div className="text-xs text-muted-foreground self-center">
                  Compare up to 3 stocks simultaneously
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Indices */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Market Indices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketIndices.map((index) => (
              <Card key={index.symbol} className="luxury-card cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleStockClick(index.symbol)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{index.symbol}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">${index.price.toFixed(2)}</div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    index.change >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {index.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trending Stocks */}
          <div className="lg:col-span-1">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Trending Stocks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleStockClick(stock.symbol)}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{stock.symbol}</span>
                      <span className="text-sm font-semibold">${stock.price.toFixed(2)}</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      stock.change >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Stock Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStocks.length > 0 && stockQuote ? (
              <>
                {/* Stock Header */}
                <Card className="luxury-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-3xl flex items-center gap-3">
                          {selectedStocks[0]}
                          <LineChart className="h-8 w-8 text-primary" />
                        </CardTitle>
                        {stockProfile && (
                          <p className="text-muted-foreground mt-1">{stockProfile.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">${stockQuote.price.toFixed(2)}</div>
                        <div className={cn(
                          "flex items-center gap-1 text-xl font-medium mt-1 justify-end",
                          stockQuote.change >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {stockQuote.change >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                          <span>{stockQuote.change >= 0 ? '+' : ''}{stockQuote.change.toFixed(2)} ({stockQuote.changePercent.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Open</p>
                        <p className="font-bold">${stockQuote.open.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">High</p>
                        <p className="font-bold text-green-500">${stockQuote.high.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Low</p>
                        <p className="font-bold text-red-500">${stockQuote.low.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Prev Close</p>
                        <p className="font-bold">${stockQuote.previousClose.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Interactive Chart */}
                <AdvancedStockChart symbols={selectedStocks} />

                {/* Technical Indicators */}
                <TechnicalIndicators symbol={selectedStocks[0]} />

                {/* Market Depth & News */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MarketDepth symbol={selectedStocks[0]} />
                  <StockNews symbol={selectedStocks[0]} />
                </div>
              </>
            ) : (
              <Card className="luxury-card h-full flex items-center justify-center min-h-[600px]">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
                  <p className="text-2xl font-bold mb-2">Advanced Trading Platform</p>
                  <p className="text-lg text-muted-foreground mb-4">Search for any stock to begin analysis</p>
                  <div className="text-sm text-muted-foreground">
                    Try searching for AAPL, TSLA, GOOGL, or any other stock symbol
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Stocks;
