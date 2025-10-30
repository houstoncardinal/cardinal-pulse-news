import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TrendingBatchGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState(`pierre robert
azure outage
floyd roger myers jr
trey yesavage
cavaliers vs celtics
lakers vs timberwolves
federal reserve interest rate cuts
pacers vs mavericks
google stock
rosie o'donnell daughter
morgan wallen tour 2026
jake laravia`);
  const [progress, setProgress] = useState<string>("");

  const generateBatch = async () => {
    if (!topics.trim()) {
      toast.error("Please enter trending topics");
      return;
    }

    setIsGenerating(true);
    setProgress("Starting batch generation...");

    try {
      // Parse topics (one per line)
      const topicList = topics
        .split("\n")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (topicList.length === 0) {
        toast.error("No valid topics found");
        return;
      }

      setProgress(`Generating ${topicList.length} viral articles...`);

      const { data, error } = await supabase.functions.invoke('generate-trending-batch', {
        body: { topics: topicList }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`🎉 Generated ${data.successCount} trending articles!`);
        setProgress(`✓ Complete: ${data.successCount}/${data.totalRequested} articles published`);
        
        // Clear topics
        setTopics("");
        
        // Refresh after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to generate articles');
      }

    } catch (error: any) {
      console.error('Error generating batch:', error);
      toast.error(error.message || 'Failed to generate articles');
      setProgress("❌ Batch generation failed");
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress("");
      }, 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Trending Batch Generator
        </CardTitle>
        <CardDescription>
          Generate viral articles for multiple trending topics at once. Enter one topic per line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="pierre robert&#10;azure outage&#10;floyd roger myers jr&#10;trey yesavage&#10;cavaliers vs celtics&#10;lakers vs timberwolves&#10;federal reserve interest rate cuts&#10;pacers vs mavericks&#10;google stock&#10;rosie o'donnell daughter&#10;morgan wallen tour 2026&#10;jake laravia"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          rows={12}
          disabled={isGenerating}
          className="font-mono text-sm"
        />
        
        {progress && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {progress}
          </div>
        )}
        
        <Button
          onClick={generateBatch}
          disabled={isGenerating || !topics.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Viral Articles...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Batch
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This will generate powerful, viral-worthy articles for each topic and publish them immediately.
          Each article is optimized for maximum engagement and social sharing.
        </p>
      </CardContent>
    </Card>
  );
};
