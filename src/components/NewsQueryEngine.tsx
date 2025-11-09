import { useState } from "react";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { SpotlightAceternity } from "@/components/ui/spotlight-aceternity";
import { SpotlightInteractive } from "@/components/ui/spotlight-interactive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, TrendingUp, Globe2, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function NewsQueryEngine() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Enter a query",
        description: "Please enter a news topic to search for.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: { 
          message: `As a powerful news intelligence engine, provide comprehensive real-time information about: "${query}". Include latest developments, breaking news, global trends, and key facts. Format your response in a clear, journalistic style.`,
          type: 'general'
        }
      });

      if (error) throw error;

      if (data?.response) {
        setResponse(data.response);
        toast({
          title: "Query Complete",
          description: "Got the latest news intelligence for you.",
        });
      }
    } catch (error) {
      console.error('Error querying news:', error);
      toast({
        title: "Query Failed",
        description: error instanceof Error ? error.message : "Failed to fetch news intelligence.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickQueries = [
    "Latest AI breakthroughs",
    "Global climate updates",
    "Tech industry trends",
    "Breaking world news",
    "Financial markets today"
  ];

  return (
    <Card className="w-full min-h-[600px] bg-gradient-to-br from-black via-zinc-950 to-black relative overflow-hidden border-primary/20">
      <SpotlightAceternity
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgb(220, 38, 38)"
      />
      <SpotlightInteractive size={300} />
      
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
        {/* Left content - Query Interface */}
        <div className="flex-1 p-8 lg:p-12 relative z-10 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-red-500/20 rounded-2xl backdrop-blur-sm border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-400">
                  News Intelligence
                </h1>
                <p className="text-primary font-semibold text-sm flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  REAL-TIME INTELLIGENCE • GLOBAL COVERAGE
                </p>
              </div>
            </div>
            
            <p className="text-zinc-300 text-lg max-w-lg leading-relaxed">
              Ask anything about world news, breaking stories, trends, or topics. 
              Get instant, comprehensive intelligence on any news topic worldwide.
            </p>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-red-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative flex gap-2 bg-black/90 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
                <Input
                  type="text"
                  placeholder="Ask about any news topic worldwide..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
                <Button
                  onClick={handleQuery}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-500/90 text-white font-semibold px-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Query
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Query Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(q)}
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 text-zinc-300 text-xs rounded-lg transition-all duration-300"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* Response Area */}
          {response && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">AI INTELLIGENCE REPORT</span>
              </div>
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/10 max-h-96 overflow-y-auto">
                <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {response}
                </p>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex gap-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-white font-bold text-sm">Global Coverage</p>
                <p className="text-zinc-500 text-xs">195+ Countries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-white font-bold text-sm">AI Powered</p>
                <p className="text-zinc-500 text-xs">Real-time Analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/60 z-10"></div>
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  );
}
