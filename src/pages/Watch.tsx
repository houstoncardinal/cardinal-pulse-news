import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { useArticles } from "@/hooks/useArticles";
import { TrendingUp, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const Watch = () => {
  const { data: topics } = useTrendingTopics();
  const { data: articles } = useArticles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  // Auto-rotate news every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(topics?.length || 1, 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [topics]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTopic = topics?.[currentIndex];
  const topArticle = articles?.[0];

  return (
    <>
      <Helmet>
        <title>Cardinal News - Watch Widget</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Helmet>
      
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-2 overflow-hidden">
        {/* Optimized for watches (200-400px) and small screens */}
        <div className="w-full max-w-[400px] space-y-3">
          
          {/* Time Display */}
          <div className="text-center mb-4 animate-fade-in">
            <div className="text-4xl font-bold font-display mb-1">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-white/60">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Live Trending Indicator */}
          <div className="flex items-center justify-center gap-2 mb-3 animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Live News
            </span>
          </div>

          {/* Main News Card - Optimized for readability */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-black border border-primary/30 slide-up">
            {/* Background gradient animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent gradient-animate" />
            
            <div className="relative p-4 space-y-3">
              {/* Category Badge */}
              {currentTopic && (
                <Badge className="bg-primary/90 text-white text-xs px-2 py-0.5 mb-2">
                  {currentTopic.category?.toUpperCase() || 'NEWS'}
                </Badge>
              )}

              {/* Headline - Large and readable */}
              <h1 className="text-lg font-bold leading-tight line-clamp-3 font-display">
                {currentTopic?.topic || topArticle?.title || 'Loading latest news...'}
              </h1>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{currentTopic?.trend_strength || 85}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Just now</span>
                </div>
              </div>

              {/* Progress dots for carousel */}
              {topics && topics.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-2">
                  {topics.slice(0, 5).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === currentIndex % topics.length
                          ? 'w-6 bg-primary'
                          : 'w-1.5 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secondary Headlines - Scrollable list */}
          <div className="space-y-2">
            {articles?.slice(1, 4).map((article, idx) => (
              <div
                key={article.id}
                className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-primary/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-2">
                  <div className="text-primary font-bold text-xs mt-0.5">
                    {idx + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">
                      {article.title}
                    </p>
                    <div className="text-xs text-white/50 mt-1">
                      {article.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Branding - Subtle */}
          <div className="text-center pt-3">
            <div className="text-xs text-white/40 font-display">
              Cardinal News
            </div>
          </div>
        </div>

        {/* Ambient glow effect */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>
    </>
  );
};

export default Watch;
