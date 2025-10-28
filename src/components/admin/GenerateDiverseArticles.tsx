import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const GenerateDiverseArticles = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [articlesPerCategory, setArticlesPerCategory] = useState(3);
  const [results, setResults] = useState<any>(null);

  const generateArticles = async () => {
    setIsGenerating(true);
    setResults(null);
    
    try {
      toast.info("Starting article generation across all categories...");
      
      const { data, error } = await supabase.functions.invoke('generate-diverse-articles', {
        body: { articlesPerCategory }
      });

      if (error) throw error;

      setResults(data);
      toast.success(data.message);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating articles:', error);
      toast.error(error.message || 'Failed to generate articles');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Diverse Articles
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically generate high-quality articles across all categories
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articles-per-category">Articles per Category</Label>
          <Input
            id="articles-per-category"
            type="number"
            min="1"
            max="5"
            value={articlesPerCategory}
            onChange={(e) => setArticlesPerCategory(parseInt(e.target.value) || 1)}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Total: {articlesPerCategory * 8} articles (8 categories)
          </p>
        </div>

        <Button 
          onClick={generateArticles} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Articles...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Articles
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Generation Results</h4>
            <div className="space-y-1 text-sm">
              <p>Total Articles Generated: <strong>{results.totalArticles}</strong></p>
              <div className="mt-2 space-y-1">
                {results.results?.map((result: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={result.status === 'generated' ? 'text-green-500' : 'text-red-500'}>
                      {result.status === 'generated' ? '✓' : '✗'}
                    </span>
                    <span className="text-muted-foreground">
                      {result.category}: {result.topic.substring(0, 50)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
