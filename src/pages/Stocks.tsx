import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StockTicker } from "@/components/StockTicker";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

const MARKET_INDICES = ['SPY', 'QQQ', 'DIA', 'IWM'];
const TRENDING_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'];

const Stocks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [marketIndices, setMarketIndices] = useState<StockQuote[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<StockQuote[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockProfile, setStockProfile] = useState<CompanyProfile | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      if (indicesData.data?.quotes) setMarketIndices(indicesData.data.quotes);
      if (trendingData.data?.quotes) setTrendingStocks(trendingData.data.quotes);
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
      if (quoteData.data?.quotes?.[0]) setStockQuote(quoteData.data.quotes[0]);
    } catch (error) {
      console.error('Error fetching stock details:', error);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchStockDetails(selectedStock);
    }
  }, [selectedStock]);

  const handleStockClick = (symbol: string) => {
    setSelectedStock(symbol);
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

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search stocks by symbol or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-background/50 backdrop-blur-xl border-white/10"
            />
          </div>
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

          {/* Stock Details */}
          <div className="lg:col-span-2">
            {selectedStock && stockQuote ? (
              <Card className="luxury-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl">{selectedStock}</CardTitle>
                      {stockProfile && (
                        <p className="text-muted-foreground mt-1">{stockProfile.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">${stockQuote.price.toFixed(2)}</div>
                      <div className={cn(
                        "flex items-center gap-1 text-lg font-medium mt-1",
                        stockQuote.change >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {stockQuote.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        <span>{stockQuote.change >= 0 ? '+' : ''}{stockQuote.change.toFixed(2)} ({stockQuote.changePercent.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="stats">Statistics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      {stockProfile && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Exchange</p>
                            <p className="font-semibold">{stockProfile.exchange}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Industry</p>
                            <p className="font-semibold">{stockProfile.finnhubIndustry}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Market Cap</p>
                            <p className="font-semibold">${(stockProfile.marketCapitalization / 1000).toFixed(2)}B</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Country</p>
                            <p className="font-semibold">{stockProfile.country}</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="stats" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Open</p>
                          <p className="font-semibold">${stockQuote.open.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Previous Close</p>
                          <p className="font-semibold">${stockQuote.previousClose.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Day High</p>
                          <p className="font-semibold text-green-500">${stockQuote.high.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Day Low</p>
                          <p className="font-semibold text-red-500">${stockQuote.low.toFixed(2)}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="luxury-card h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Select a stock to view details</p>
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
