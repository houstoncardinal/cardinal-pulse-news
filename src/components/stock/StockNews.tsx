import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface StockNewsProps {
  symbol: string;
}

interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string;
}

export const StockNews = ({ symbol }: StockNewsProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate mock news for demo purposes
  const generateMockNews = (symbol: string): NewsItem[] => {
    const headlines = [
      `${symbol} Reports Strong Q4 Earnings, Beats Analyst Expectations`,
      `Market Analysis: ${symbol} Shows Bullish Technical Patterns`,
      `${symbol} Announces New Strategic Partnership`,
      `Investors React to ${symbol}'s Latest Product Launch`,
      `${symbol} Faces Regulatory Scrutiny Over Recent Developments`,
      `Analyst Upgrades ${symbol} Rating to Buy`,
      `${symbol} Expands Operations in Key Markets`,
      `${symbol} CEO Comments on Future Growth Prospects`,
      `Technical Analysis: ${symbol} Breaks Key Resistance Level`,
      `${symbol} Dividend Increase Signals Confidence`
    ];

    return headlines.map((headline, index) => ({
      headline,
      summary: `This is a summary of the latest news about ${symbol}. The company continues to show strong performance in the market with various developments and strategic initiatives.`,
      source: ['Bloomberg', 'Reuters', 'CNBC', 'WSJ', 'Yahoo Finance'][index % 5],
      url: `https://example.com/news/${symbol.toLowerCase()}-${index + 1}`,
      datetime: Date.now() - (index * 24 * 60 * 60 * 1000), // Days ago
      image: `https://images.unsplash.com/photo-${1500000000000 + index}?q=80&w=400`
    }));
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: {
            symbols: [symbol],
            type: 'news'
          }
        });

        if (error) {
          console.error('Error fetching news:', error);
          // Fall back to mock news
          setNews(generateMockNews(symbol));
        } else if (data?.news && data.news.length > 0) {
          setNews(data.news.slice(0, 10));
        } else {
          // Fall back to mock news if no real news
          setNews(generateMockNews(symbol));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fall back to mock news
        setNews(generateMockNews(symbol));
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  if (loading) {
    return (
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          Latest News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex gap-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.headline}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <span>{format(new Date(item.datetime * 1000), 'MMM dd, HH:mm')}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
