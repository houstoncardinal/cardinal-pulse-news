import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dices, Sparkles, Trophy, Zap, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const randomTopics = [
  { topic: "AI Revolution in Healthcare", category: "technology", icon: Zap },
  { topic: "Climate Change Solutions", category: "science", icon: Star },
  { topic: "Space Tourism Breakthrough", category: "science", icon: Sparkles },
  { topic: "Cryptocurrency Market Trends", category: "business", icon: Trophy },
  { topic: "Mental Health Awareness", category: "lifestyle", icon: Star },
  { topic: "Electric Vehicle Innovation", category: "technology", icon: Zap },
  { topic: "Global Education Reform", category: "world", icon: Sparkles },
  { topic: "Sustainable Fashion Movement", category: "entertainment", icon: Star },
  { topic: "Quantum Computing Advances", category: "technology", icon: Zap },
  { topic: "Political Shifts Worldwide", category: "politics", icon: Flame },
];

export const CreativeBurstGenerator = () => {
  const [spinning, setSpinning] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<typeof randomTopics>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const spinSlots = () => {
    setSpinning(true);
    
    // Simulate slot machine spinning
    const spinInterval = setInterval(() => {
      const shuffled = [...randomTopics].sort(() => Math.random() - 0.5);
      setSelectedTopics(shuffled.slice(0, 3));
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      setSpinning(false);
      
      // Final selection
      const finalSelection = [...randomTopics].sort(() => Math.random() - 0.5).slice(0, 3);
      setSelectedTopics(finalSelection);
    }, 2000);
  };

  const handleGenerateAll = async () => {
    if (selectedTopics.length === 0) {
      toast.error('Spin the slots first!');
      return;
    }

    setIsGenerating(true);
    let successCount = 0;

    try {
      for (const item of selectedTopics) {
        // Create trending topic
        const { data: trendData, error: trendError } = await supabase
          .from('trending_topics')
          .insert({
            topic: item.topic,
            trend_strength: Math.floor(Math.random() * 30) + 70,
            search_volume: Math.floor(Math.random() * 100000) + 10000,
            category: item.category as any,
            region: 'US',
            keywords: ['trending', 'viral'],
            processed: false
          })
          .select()
          .single();

        if (trendError) throw trendError;

        // Generate article
        const { error: genError } = await supabase.functions.invoke('generate-article', {
          body: { trendingTopicId: trendData.id }
        });

        if (!genError) successCount++;
      }

      toast.success(`🎉 Generated ${successCount} articles from random burst!`);
      setSelectedTopics([]);
    } catch (error) {
      toast.error('Some articles failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-pink-500/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
            <Dices className="h-6 w-6 text-pink-500 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-primary bg-clip-text text-transparent">
              Creative Burst Generator
            </CardTitle>
            <CardDescription className="mt-1">
              Slot machine style randomized article generation
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Slot Machine Display */}
        <div className="bg-gradient-to-br from-background/50 to-muted/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-primary/20">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {selectedTopics.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square flex items-center justify-center bg-background/50 rounded-xl border-2 border-dashed border-muted-foreground/20">
                    <Dices className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                ))}
              </>
            ) : (
              selectedTopics.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`relative group ${
                      spinning ? 'animate-bounce-in' : 'animate-reveal-scale'
                    }`}
                    style={{
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10 hover:scale-105 transition-transform duration-300">
                      <CardContent className="p-4 flex flex-col items-center text-center h-full justify-center">
                        <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl mb-3">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-bold text-sm mb-2 line-clamp-2">{item.topic}</h4>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {!spinning && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce-in">
                            <Sparkles className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={spinSlots}
              disabled={spinning || isGenerating}
              className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-500/90 hover:to-purple-500/90"
            >
              {spinning ? (
                <>
                  <Dices className="mr-2 h-5 w-5 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Dices className="mr-2 h-5 w-5" />
                  Spin the Slots!
                </>
              )}
            </Button>

            {selectedTopics.length > 0 && !spinning && (
              <Button
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className="flex-1 h-14 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate All 3
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            🎰 Let fate decide your next viral articles!
          </p>
          <p className="text-xs text-muted-foreground">
            Spin to get 3 random trending topics and generate them all at once
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
