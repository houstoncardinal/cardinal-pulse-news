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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: {
            symbols: [symbol],
            type: 'news'
          }
        });

        if (error) throw error;
        if (data?.news) {
          setNews(data.news.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
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
