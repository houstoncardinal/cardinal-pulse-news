import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const QuickCreate = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Insert trend manually
      const { data: trend, error: trendError } = await supabase
        .from('trending_topics')
        .insert({
          topic: topic,
          category: 'world',
          trend_strength: 100,
          region: 'global',
          search_volume: 50000,
          keywords: topic.split(' ').slice(0, 5),
          processed: false
        })
        .select()
        .single();

      if (trendError) throw trendError;

      // Generate article immediately
      const { error: genError } = await supabase.functions.invoke('generate-article', {
        body: { trendingTopicId: trend.id }
      });

      if (genError) throw genError;

      toast.success(`🚀 Generating article for: ${topic}`);
      setTopic("");
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate article');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSeedDiverseTopics = async () => {
    setIsSeeding(true);
    const toastId = toast.loading('Clearing old topics and seeding fresh trending topics...');
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-trending-topics', {
        body: { 
          forceRefresh: true,  // Always force refresh to seed new topics
          articlesPerTopic: 1
        }
      });

      if (error) throw error;
      
      toast.success(
        `✅ Seeded ${data.topicsInserted || 0} fresh topics and generated ${data.articlesGenerated || 0} articles across ${data.categoriesRepresented?.length || 0} categories!`, 
        { id: toastId, duration: 6000 }
      );
      
      // Reload the page to show new topics
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to seed topics: ' + (error instanceof Error ? error.message : 'Unknown error'), { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };


  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 animate-scale-in relative overflow-hidden group">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 gradient-animate opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow orb effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg w-fit glow-pulse">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors duration-300">⚡ Quick Article Generator</h3>
            <p className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">Enter any topic to instantly create an AI-powered article</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter trending topic..."
            onKeyPress={(e) => e.key === 'Enter' && handleQuickGenerate()}
            disabled={isGenerating}
            className="flex-1 h-11 transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
          />
          <Button 
            onClick={handleQuickGenerate}
            disabled={isGenerating || !topic.trim()}
            className="gap-2 h-11 w-full sm:w-auto transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
            size="default"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Generating</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Now</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={handleSeedDiverseTopics}
          disabled={isSeeding}
          size="lg"
          className="w-full mt-3 h-auto py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3 w-full justify-center">
            <Database className="h-5 w-5" />
            <div className="text-left">
              <div className="font-bold text-sm">
                {isSeeding ? "Populating Topics..." : "Populate Trending Topics"}
              </div>
              <div className="text-xs text-white/90 font-normal">
                Add variety • All categories • Auto-generate
              </div>
            </div>
            {isSeeding && <Sparkles className="h-4 w-4 animate-pulse" />}
          </div>
        </Button>

      </div>
    </Card>
  );
};
