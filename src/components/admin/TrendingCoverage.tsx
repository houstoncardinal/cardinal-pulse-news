import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { useArticles } from "@/hooks/useArticles";
import { Loader2, Sparkles, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const TrendingCoverage = () => {
  const { data: trends = [] } = useTrendingTopics();
  const { data: articles = [] } = useArticles();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Analyze coverage by category
  const getCoverageByCategory = () => {
    const categories = ['business', 'technology', 'sports', 'entertainment', 'health', 'politics', 'world', 'local'];
    
    return categories.map(category => {
      const categoryTrends = trends.filter(t => t.category === category);
      const processedTrends = categoryTrends.filter(t => t.processed);
      const categoryArticles = articles.filter(a => a.category === category && 
        a.created_at && new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      return {
        category,
        totalTrends: categoryTrends.length,
        processedTrends: processedTrends.length,
        recentArticles: categoryArticles.length,
        coverage: categoryTrends.length > 0 ? (processedTrends.length / categoryTrends.length) * 100 : 0,
        unprocessedTrends: categoryTrends.filter(t => !t.processed)
      };
    });
  };

  const coverageData = getCoverageByCategory();

  const handleFillAllGaps = async () => {
    setGenerating(true);
    setProgress(0);
    
    try {
      // Get all unprocessed trends
      const allUnprocessedTrends = coverageData.flatMap(c => c.unprocessedTrends);
      
      if (allUnprocessedTrends.length === 0) {
        toast.info("All trending topics already have articles!");
        return;
      }

      toast.success(`Generating ${allUnprocessedTrends.length} articles...`);
      
      let completed = 0;
      
      // Generate articles for all unprocessed trends
      for (const trend of allUnprocessedTrends) {
        try {
          const { error } = await supabase.functions.invoke('generate-article', {
            body: { trendingTopicId: trend.id }
          });

          if (error) {
            console.error(`Failed to generate article for ${trend.topic}:`, error);
          }
          
          completed++;
          setProgress((completed / allUnprocessedTrends.length) * 100);
        } catch (err) {
          console.error(`Error generating article for ${trend.topic}:`, err);
        }
      }

      toast.success(`Successfully initiated generation of ${completed} articles!`);
    } catch (error) {
      console.error("Error filling gaps:", error);
      toast.error("Failed to generate articles");
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleFillCategoryGaps = async (category: string) => {
    setGenerating(true);
    
    try {
      const categoryData = coverageData.find(c => c.category === category);
      if (!categoryData || categoryData.unprocessedTrends.length === 0) {
        toast.info(`No gaps to fill in ${category}`);
        return;
      }

      toast.success(`Generating ${categoryData.unprocessedTrends.length} articles for ${category}...`);

      let completed = 0;
      for (const trend of categoryData.unprocessedTrends) {
        try {
          const { error } = await supabase.functions.invoke('generate-article', {
            body: { trendingTopicId: trend.id }
          });

          if (!error) completed++;
        } catch (err) {
          console.error(`Error generating article:`, err);
        }
      }

      toast.success(`Initiated ${completed} article generations for ${category}!`);
    } catch (error) {
      console.error("Error filling category gaps:", error);
      toast.error("Failed to generate articles");
    } finally {
      setGenerating(false);
    }
  };

  const totalGaps = coverageData.reduce((sum, c) => sum + c.unprocessedTrends.length, 0);
  const avgCoverage = coverageData.reduce((sum, c) => sum + c.coverage, 0) / coverageData.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trending Coverage Dashboard
          </CardTitle>
          <CardDescription>
            Fill gaps in trending categories with AI-generated articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalGaps}</div>
                <p className="text-sm text-muted-foreground">Unprocessed Trends</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{avgCoverage.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Average Coverage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{trends.length}</div>
                <p className="text-sm text-muted-foreground">Total Trending Topics</p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleFillAllGaps}
              disabled={generating || totalGaps === 0}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating... {progress.toFixed(0)}%
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fill All Gaps ({totalGaps})
                </>
              )}
            </Button>
          </div>

          {generating && progress > 0 && (
            <Progress value={progress} className="w-full" />
          )}

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Category Coverage
            </h3>
            <div className="grid gap-4">
              {coverageData.map(data => (
                <Card key={data.category}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold capitalize">{data.category}</h4>
                        <Badge variant={data.coverage >= 80 ? "default" : data.coverage >= 50 ? "secondary" : "destructive"}>
                          {data.coverage.toFixed(0)}% Coverage
                        </Badge>
                      </div>
                      {data.unprocessedTrends.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleFillCategoryGaps(data.category)}
                          disabled={generating}
                        >
                          Fill {data.unprocessedTrends.length} Gaps
                        </Button>
                      )}
                    </div>
                    <Progress value={data.coverage} className="mb-2" />
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{data.totalTrends} trends</span>
                      <span>{data.processedTrends} processed</span>
                      <span>{data.recentArticles} recent articles</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
