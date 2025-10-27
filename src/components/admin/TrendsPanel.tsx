import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Sparkles } from "lucide-react";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const TrendsPanel = () => {
  const { data: trends, isLoading } = useTrendingTopics();
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const handleGenerateArticle = async (trendId: string, topic: string) => {
    setGeneratingIds(prev => new Set(prev).add(trendId));
    
    try {
      const { error } = await supabase.functions.invoke('generate-article', {
        body: { trendingTopicId: trendId }
      });

      if (error) throw error;
      
      toast.success(`Generating article for: ${topic}`);
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Failed to generate article');
    } finally {
      setGeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(trendId);
        return newSet;
      });
    }
  };

  const handleFetchTrends = async () => {
    toast.loading('Fetching latest trends...');
    
    try {
      const { error } = await supabase.functions.invoke('fetch-trends', {
        body: { region: 'global', limit: 20 }
      });

      if (error) throw error;
      
      toast.success('Successfully fetched latest trends');
    } catch (error) {
      console.error('Error fetching trends:', error);
      toast.error('Failed to fetch trends');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Trending Topics</h2>
          <p className="text-sm text-muted-foreground">Real-time updates • Click to generate</p>
        </div>
        <Button onClick={handleFetchTrends} variant="outline" className="hover-scale">
          <TrendingUp className="mr-2 h-4 w-4" />
          Refresh Trends
        </Button>
      </div>

      <div className="grid gap-4">
        {trends?.map((trend) => (
          <Card key={trend.id} className="p-4 hover-scale transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{trend.topic}</h3>
                  <Badge variant="secondary">{trend.category}</Badge>
                  <Badge variant="outline">{trend.region}</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Strength: {trend.trend_strength}/100</span>
                  <span>Volume: {trend.search_volume?.toLocaleString()}</span>
                </div>

                {trend.keywords && trend.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trend.keywords.slice(0, 5).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleGenerateArticle(trend.id, trend.topic)}
                disabled={trend.processed || generatingIds.has(trend.id)}
                size="sm"
              >
                {generatingIds.has(trend.id) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : trend.processed ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generated
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Article
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
