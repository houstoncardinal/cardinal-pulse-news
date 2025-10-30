import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Flame, Brain, Rocket, Heart, Coffee, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContentMode = {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  prompt: string;
};

const contentModes: ContentMode[] = [
  {
    id: 'viral',
    name: 'Viral Sensation',
    description: 'Maximum engagement & shareability',
    icon: Flame,
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    prompt: 'Create an ultra-viral, shareable article that will break the internet'
  },
  {
    id: 'investigative',
    name: 'Deep Dive',
    description: 'In-depth investigative journalism',
    icon: Brain,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    prompt: 'Write a comprehensive investigative piece with detailed analysis'
  },
  {
    id: 'breaking',
    name: 'Breaking News',
    description: 'Fast, accurate, newsworthy',
    icon: Zap,
    color: 'text-yellow-500',
    gradient: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    prompt: 'Create breaking news coverage that captures urgency and importance'
  },
  {
    id: 'inspirational',
    name: 'Inspirational',
    description: 'Uplifting & motivational',
    icon: Heart,
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-purple-500/20 border-pink-500/30',
    prompt: 'Write an inspiring, uplifting story that motivates readers'
  },
  {
    id: 'casual',
    name: 'Casual Read',
    description: 'Conversational & relatable',
    icon: Coffee,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    prompt: 'Create a casual, conversational article that feels like chatting with a friend'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Exclusive, high-quality content',
    icon: Star,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    prompt: 'Craft premium, exclusive content worthy of top-tier publications'
  },
];

export const AIContentLab = () => {
  const [selectedMode, setSelectedMode] = useState<ContentMode | null>(null);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim() || !selectedMode) {
      toast.error('Please enter a topic and select a mode');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      // First create trending topic
      const { data: trendData, error: trendError } = await supabase
        .from('trending_topics')
        .insert({
          topic: topic.trim(),
          trend_strength: 85,
          search_volume: Math.floor(Math.random() * 100000) + 10000,
          category: 'technology',
          region: 'US',
          keywords: [selectedMode.name, 'trending'],
          processed: false
        })
        .select()
        .single();

      if (trendError) throw trendError;

      // Then generate article with mode-specific prompt
      const { error } = await supabase.functions.invoke('generate-article', {
        body: { 
          trendingTopicId: trendData.id,
          customPrompt: `${selectedMode.prompt}. Topic: ${topic}`
        }
      });

      if (error) throw error;

      clearInterval(progressInterval);
      setProgress(100);
      
      toast.success(`🎉 ${selectedMode.name} article created!`);
      setTopic("");
      setSelectedMode(null);
      
      setTimeout(() => {
        setProgress(0);
      }, 2000);
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error('Failed to generate article');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-purple-500/5">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl backdrop-blur-sm animate-pulse-glow">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Content Lab
            </CardTitle>
            <CardDescription className="mt-1">
              Creative playground for generating extraordinary content
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">What's your topic?</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter any topic, trend, or idea..."
            className="h-12 text-lg bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/50"
            disabled={isGenerating}
          />
        </div>

        {/* Content Modes Grid */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            Select Content Mode
            {selectedMode && (
              <Badge variant="outline" className="ml-2">
                {selectedMode.name} selected
              </Badge>
            )}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contentModes.map((mode, index) => {
              const Icon = mode.icon;
              const isSelected = selectedMode?.id === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  disabled={isGenerating}
                  className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                    isSelected ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                  }`}
                  style={{
                    animation: `reveal-scale 0.5s ease-out ${index * 0.1}s backwards`,
                  }}
                >
                  <Card className={`border-2 transition-all duration-300 bg-gradient-to-br ${mode.gradient} ${
                    isSelected ? 'border-primary shadow-[0_0_30px_rgba(var(--primary),0.3)]' : 'border-transparent'
                  }`}>
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                    )}
                    <CardContent className="p-4 relative">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-3 mx-auto bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm transition-transform duration-300 ${
                        isSelected ? 'scale-110 rotate-12' : 'group-hover:scale-105'
                      }`}>
                        <Icon className={`h-6 w-6 ${mode.color}`} />
                      </div>
                      <h3 className="font-bold text-sm text-center mb-1">{mode.name}</h3>
                      <p className="text-xs text-muted-foreground text-center">{mode.description}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generating {selectedMode?.name} content...</span>
              <span className="font-mono text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || !selectedMode}
          className="w-full h-14 text-lg bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              Creating Magic...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate {selectedMode ? selectedMode.name : 'Article'}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Each mode uses specialized AI prompts to create unique, engaging content tailored to your needs
        </p>
      </CardContent>
    </Card>
  );
};
