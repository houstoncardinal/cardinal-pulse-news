import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Globe2 } from "lucide-react";

export const GenerateGlobalStories = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const generateStories = async () => {
    setIsGenerating(true);
    setResults(null);
    
    try {
      toast.info("🌍 Generating diverse global stories from around the world...");
      
      const { data, error } = await supabase.functions.invoke('generate-diverse-global-stories', {
        body: {}
      });

      if (error) throw error;

      setResults(data);
      toast.success(data.message);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating global stories:', error);
      toast.error(error.message || 'Failed to generate global stories');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              Generate Global Stories
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Import crime, neighborhood, regional, and community news from around the world
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>This powerful feature will generate:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Crime reports and investigations from major cities</li>
            <li>Neighborhood and community stories</li>
            <li>Regional developments and policy changes</li>
            <li>Local government and municipal updates</li>
            <li>Public safety and emergency services news</li>
            <li>Infrastructure and urban development</li>
            <li>Local business and economic stories</li>
            <li>Community events and cultural coverage</li>
          </ul>
          <p className="mt-3 font-semibold text-primary">
            Coverage from 50+ cities across all continents
          </p>
        </div>

        <Button 
          onClick={generateStories} 
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Global Stories...
            </>
          ) : (
            <>
              <Globe2 className="mr-2 h-5 w-5" />
              Generate Diverse Global Stories
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-background/80 rounded-lg border border-border">
            <h4 className="font-semibold mb-2">Generation Results</h4>
            <div className="space-y-2 text-sm">
              <p>Locations Scanned: <strong>{results.locationsScanned}</strong></p>
              <p>Articles Generated: <strong className="text-primary">{results.totalGenerated}</strong></p>
              
              {results.sampleArticles && results.sampleArticles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="font-semibold">Sample Articles:</p>
                  {results.sampleArticles.map((article: any, idx: number) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                      <p className="font-medium line-clamp-1">{article.title}</p>
                      <p className="text-muted-foreground">
                        {article.location} • {article.type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
