import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GenerationProgressDialog } from "./GenerationProgressDialog";

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  details?: string;
}

export const GenerateDiverseArticles = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [articlesPerCategory, setArticlesPerCategory] = useState(3);
  const [showProgress, setShowProgress] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);

  const categories = ['world', 'business', 'technology', 'sports', 'entertainment', 'science', 'politics'];

  const generateArticles = async () => {
    setIsGenerating(true);
    setShowProgress(true);

    // Initialize steps
    const initialSteps: GenerationStep[] = [
      { id: 'init', label: 'Initializing generation process', status: 'loading' },
      ...categories.map(cat => ({
        id: cat,
        label: `Generating ${articlesPerCategory} ${cat} article(s)`,
        status: 'pending' as const
      })),
      { id: 'complete', label: 'Finalizing and refreshing', status: 'pending' }
    ];
    setSteps(initialSteps);

    try {
      // Step 1: Initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      setSteps(prev => prev.map(s => 
        s.id === 'init' ? { ...s, status: 'complete', details: 'Ready to generate articles' } : s
      ));

      // Step 2: Generate articles for each category
      const { data, error } = await supabase.functions.invoke('generate-diverse-articles', {
        body: { articlesPerCategory }
      });

      if (error) throw error;

      // Update steps as categories complete
      for (const cat of categories) {
        const categoryResult = data.results?.find((r: any) => r.category === cat);
        setSteps(prev => prev.map(s => 
          s.id === cat ? {
            ...s,
            status: categoryResult ? 'complete' : 'error',
            details: categoryResult 
              ? `Generated ${categoryResult.count || 0} articles`
              : 'Failed to generate'
          } : s
        ));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Step 3: Complete
      setSteps(prev => prev.map(s => 
        s.id === 'complete' ? { ...s, status: 'complete', details: `Total: ${data.totalGenerated || 0} articles` } : s
      ));

      toast.success(`Generated ${data.totalGenerated || 0} articles across ${categories.length} categories!`);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error generating articles:', error);
      toast.error(error.message || 'Failed to generate articles');
      setSteps(prev => prev.map(s => 
        s.status === 'loading' ? { ...s, status: 'error', details: 'Generation failed' } : s
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Diverse Articles
          </CardTitle>
          <CardDescription>
            Create articles across all categories with AI-powered content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="articlesPerCategory">Articles per Category</Label>
            <Input
              id="articlesPerCategory"
              type="number"
              min={1}
              max={10}
              value={articlesPerCategory}
              onChange={(e) => setArticlesPerCategory(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Will generate {articlesPerCategory * categories.length} total articles
            </p>
          </div>
          <Button
            onClick={generateArticles}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Articles'}
          </Button>
        </CardContent>
      </Card>

      <GenerationProgressDialog
        open={showProgress}
        title="Generating Diverse Articles"
        description={`Creating ${articlesPerCategory} article(s) for each of ${categories.length} categories`}
        steps={steps}
        onClose={() => setShowProgress(false)}
      />
    </>
  );
};
