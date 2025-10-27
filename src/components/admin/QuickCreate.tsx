import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap } from "lucide-react";
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

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-red-400/5 border-primary/20 animate-scale-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Quick Article Generator</h3>
          <p className="text-sm text-muted-foreground">Enter any topic to instantly create an article</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter trending topic (e.g., AI Breakthrough in Medicine)"
          onKeyPress={(e) => e.key === 'Enter' && handleQuickGenerate()}
          disabled={isGenerating}
          className="flex-1"
        />
        <Button 
          onClick={handleQuickGenerate}
          disabled={isGenerating || !topic.trim()}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Now
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
