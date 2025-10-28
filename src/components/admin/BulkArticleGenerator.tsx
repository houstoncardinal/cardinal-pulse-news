import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";

export const BulkArticleGenerator = () => {
  const [topics, setTopics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    const topicList = topics
      .split("\n")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (topicList.length === 0) {
      toast({
        title: "No Topics",
        description: "Please enter at least one topic",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-trending-articles", {
        body: { topics: topicList },
      });

      if (error) throw error;

      setResults(data.results || []);
      
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failCount = (data.results?.length || 0) - successCount;

      toast({
        title: "Generation Complete",
        description: `✅ ${successCount} articles created${failCount > 0 ? `, ❌ ${failCount} failed` : ""}`,
      });

      if (successCount > 0) {
        setTopics("");
      }
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Pre-fill with trending topics from the image
  const loadTrendingTopics = () => {
    const trendingTopics = `longest world series game
dodgers
longest baseball game ever
trail blazers vs lakers
grizzlies vs warriors
amazon layoffs
thunder vs mavericks
mookie betts
cody franke
nuggets vs timberwolves`;
    setTopics(trendingTopics);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bulk Article Generator
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate powerful articles by Hunain Qureshi
            </p>
          </div>
          <Zap className="h-8 w-8 text-primary animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Topics (one per line)</label>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTrendingTopics}
              disabled={isGenerating}
            >
              Load Trending Topics
            </Button>
          </div>
          <Textarea
            placeholder="Enter topics, one per line..."
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            rows={10}
            className="font-mono"
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || topics.trim().length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Articles...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate All Articles
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-semibold">Results:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    result.success
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">
                    {result.topic}
                    {result.success && result.title && (
                      <span className="block text-xs opacity-70">→ {result.title}</span>
                    )}
                    {!result.success && result.error && (
                      <span className="block text-xs opacity-70">→ {result.error}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
