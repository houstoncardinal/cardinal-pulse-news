import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, CloudRain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const QuickCreate = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleJamaicaWeatherStory = async () => {
    setIsGenerating(true);
    try {
      toast.loading('Fetching live Jamaica weather data and generating urgent story...');
      
      const { data, error } = await supabase.functions.invoke('generate-jamaica-weather-story');

      if (error) throw error;

      toast.success(`✓ Published urgent Jamaica weather story: "${data.article.title}"`);
    } catch (error: any) {
      console.error('Error generating Jamaica weather story:', error);
      toast.error('Failed to generate story: ' + error.message);
    } finally {
      setIsGenerating(false);
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

        {/* Urgent Jamaica Weather Button */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <Button 
            onClick={handleJamaicaWeatherStory}
            disabled={isGenerating}
            className="w-full gap-2 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
            size="lg"
          >
            <CloudRain className="h-5 w-5" />
            {isGenerating ? 'Generating Urgent Story...' : '🚨 Generate Jamaica Hurricane Weather Story'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Fetches live weather data and creates a powerful, urgent news story
          </p>
        </div>
      </div>
    </Card>
  );
};
