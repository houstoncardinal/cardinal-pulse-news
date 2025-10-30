import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Globe, Zap, Eye, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";

export const VisualTrendExplorer = () => {
  const { data: trends, isLoading } = useTrendingTopics();
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const categoryColors: Record<string, string> = {
    'technology': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'politics': 'from-red-500/20 to-pink-500/20 border-red-500/30',
    'business': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'entertainment': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    'sports': 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    'lifestyle': 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    'science': 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
    'world': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    'ai_innovation': 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
  };

  const categoryIcons: Record<string, any> = {
    'technology': Zap,
    'politics': Target,
    'business': TrendingUp,
    'entertainment': Sparkles,
    'sports': TrendingUp,
    'lifestyle': Eye,
    'science': Globe,
    'world': Globe,
    'ai_innovation': Sparkles,
  };

  const handleGenerate = async (trend: any) => {
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-article', {
        body: { trendingTopicId: trend.id }
      });

      if (error) throw error;
      toast.success(`🎉 Article generated for "${trend.topic}"!`);
      setSelectedTrend(null);
    } catch (error: any) {
      toast.error('Failed to generate article');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <Sparkles className="h-8 w-8 text-primary relative" />
            </div>
            <p className="text-muted-foreground">Loading trending universe...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unprocessedTrends = trends?.filter(t => !t.processed) || [];

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
            <Globe className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Visual Trend Explorer
            </CardTitle>
            <CardDescription className="mt-1">
              Interactive trend universe • {unprocessedTrends.length} opportunities
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Trend Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unprocessedTrends.slice(0, 12).map((trend, index) => {
            const Icon = categoryIcons[trend.category as keyof typeof categoryIcons] || Sparkles;
            const colorClass = categoryColors[trend.category as keyof typeof categoryColors] || 'from-primary/20 to-purple-500/20 border-primary/30';
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={trend.id}
                className="relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  animation: `reveal-from-bottom 0.6s ease-out ${index * 0.1}s backwards`,
                }}
              >
                <Card 
                  className={`relative overflow-hidden border cursor-pointer transition-all duration-500 ${
                    isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                  } bg-gradient-to-br ${colorClass}`}
                  onClick={() => setSelectedTrend(trend)}
                >
                  {/* Glow effect on hover */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                  )}
                  
                  {/* Animated particles */}
                  {isHovered && (
                    <>
                      <div className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full animate-ping" />
                      <div className="absolute top-4 right-4 w-1 h-1 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                      <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                    </>
                  )}

                  <CardContent className="p-5 relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm transition-transform duration-300 ${
                        isHovered ? 'scale-110 rotate-12' : ''
                      }`}>
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate text-foreground">
                          {trend.topic}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {trend.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {trend.trend_strength}% strength
                      </span>
                      <span className="font-mono">{trend.search_volume?.toLocaleString() || 'N/A'}</span>
                    </div>

                    {/* Keywords preview */}
                    {trend.keywords && trend.keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {trend.keywords.slice(0, 3).map((keyword: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Selected Trend Modal */}
        {selectedTrend && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
            onClick={() => setSelectedTrend(null)}
          >
            <Card 
              className="relative max-w-2xl w-full border-primary/30 bg-gradient-to-br from-background via-background to-primary/10 animate-bounce-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg" />
              <CardHeader className="relative">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {selectedTrend.topic}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>{selectedTrend.category}</Badge>
                  <Badge variant="outline">{selectedTrend.region}</Badge>
                  <Badge variant="outline">{selectedTrend.trend_strength}% strength</Badge>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {selectedTrend.keywords && selectedTrend.keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Related Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrend.keywords.map((keyword: string, i: number) => (
                        <span key={i} className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleGenerate(selectedTrend)}
                    disabled={isGenerating}
                    className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Article
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setSelectedTrend(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {unprocessedTrends.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No unprocessed trends available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
