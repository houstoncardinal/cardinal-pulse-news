import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GenerationProgressDialog } from "./GenerationProgressDialog";

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  details?: string;
}

export const GenerateGlobalStories = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);

  const generateStories = async () => {
    setIsGenerating(true);
    setShowProgress(true);

    const initialSteps: GenerationStep[] = [
      { id: 'init', label: 'Initializing worldwide story generation', status: 'loading' },
      { id: 'scanning', label: 'Scanning global locations and events', status: 'pending' },
      { id: 'creating', label: 'Creating diverse articles across regions', status: 'pending' },
      { id: 'complete', label: 'Finalizing and refreshing', status: 'pending' }
    ];
    setSteps(initialSteps);

    try {
      // Step 1
      await new Promise(resolve => setTimeout(resolve, 500));
      setSteps(prev => prev.map(s => 
        s.id === 'init' ? { ...s, status: 'complete', details: 'Ready to generate' } : s
      ));

      // Step 2
      setSteps(prev => prev.map(s => 
        s.id === 'scanning' ? { ...s, status: 'loading' } : s
      ));
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSteps(prev => prev.map(s => 
        s.id === 'scanning' ? { ...s, status: 'complete', details: 'Found locations worldwide' } : s
      ));

      // Step 3
      setSteps(prev => prev.map(s => 
        s.id === 'creating' ? { ...s, status: 'loading', details: 'Generating articles...' } : s
      ));

      const { data, error } = await supabase.functions.invoke('generate-diverse-global-stories');

      if (error) throw error;

      setSteps(prev => prev.map(s => 
        s.id === 'creating' ? { 
          ...s, 
          status: 'complete', 
          details: `Generated ${data.generatedCount || 0} articles from ${data.locationsScanned || 0} locations`
        } : s
      ));

      // Step 4
      setSteps(prev => prev.map(s => 
        s.id === 'complete' ? { ...s, status: 'complete', details: 'Articles published successfully' } : s
      ));

      toast.success(`Generated ${data.generatedCount || 0} global stories!`);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to generate stories: ' + (error.message || 'Unknown error'));
      setSteps(prev => prev.map(s => 
        s.status === 'loading' ? { ...s, status: 'error', details: 'Generation failed' } : s
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Generate Worldwide Stories
          </CardTitle>
          <CardDescription>
            Create diverse global news articles from regions around the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateStories}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating Stories...' : 'Generate Global Stories'}
          </Button>
        </CardContent>
      </Card>

      <GenerationProgressDialog
        open={showProgress}
        title="Generating Worldwide Stories"
        description="Creating diverse articles from global locations"
        steps={steps}
        onClose={() => setShowProgress(false)}
      />
    </>
  );
};
