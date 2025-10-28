import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe2, TrendingUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const GenerateWorldwideArticles = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const generateWorldwideArticles = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    
    try {
      toast.loading("Scanning worldwide Google Trends and generating articles...");
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('generate-worldwide-articles', {
        body: {}
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast.success(`Successfully generated ${data.totalArticles} articles from ${data.totalTrends} worldwide trends!`);
      } else {
        toast.warning(data.message || 'Generation completed with some issues');
      }

    } catch (error) {
      console.error('Error generating worldwide articles:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate articles');
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Globe2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Worldwide Article Generator</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Scan Google Trends globally and auto-generate articles for all categories
            </p>
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <TrendingUp className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <Alert className="bg-blue-500/5 border-blue-500/20">
        <AlertDescription className="text-sm">
          <strong>How it works:</strong> This will scan Google Trends from 30+ countries worldwide 
          AND major cities (NY, LA, Chicago, Houston, Miami, London, Paris, Tokyo, etc.), 
          identify trending topics across all categories, and automatically generate hyper-local articles 
          with AI-generated hero images.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-primary">30+</p>
          <p className="text-xs text-muted-foreground mt-1">Countries</p>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-primary">16</p>
          <p className="text-xs text-muted-foreground mt-1">Major Cities</p>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-primary">200+</p>
          <p className="text-xs text-muted-foreground mt-1">Trends Scanned</p>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-primary">Local</p>
          <p className="text-xs text-muted-foreground mt-1">City Stories</p>
        </div>
      </div>

      {isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Scanning trends and generating articles... This may take several minutes.
          </p>
        </div>
      )}

      {result && (
        <Alert className={result.success ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}>
          <AlertDescription>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <p className="font-semibold">
                  {result.success ? 'Generation Complete!' : 'Generation Failed'}
                </p>
                {result.success && (
                  <>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Countries</p>
                        <p className="font-bold">{result.countriesScanned || result.regionsScanned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cities</p>
                        <p className="font-bold">{result.citiesScanned || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trends</p>
                        <p className="font-bold">{result.totalTrends}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Articles</p>
                        <p className="font-bold text-primary">{result.totalArticles}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </>
                )}
                {result.error && (
                  <p className="text-sm text-red-500">{result.error}</p>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={generateWorldwideArticles}
        disabled={isGenerating}
        className="w-full h-12 text-lg font-semibold gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Worldwide Articles...
          </>
        ) : (
          <>
            <Globe2 className="h-5 w-5" />
            Generate Worldwide Articles
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        ⚡ This process uses AI credits. Each article includes AI-generated content and images.
        Estimated time: 5-10 minutes depending on trends volume.
      </p>
    </Card>
  );
};
