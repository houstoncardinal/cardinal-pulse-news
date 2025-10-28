import { TrendingUp, Zap } from "lucide-react";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";

export const TrendingTicker = () => {
  const { data: topics } = useTrendingTopics();
  
  const topicsToDisplay = topics && topics.length > 0 
    ? topics.map(t => ({
        text: `${t.category?.toUpperCase() || 'NEWS'}: ${t.topic}`,
        strength: t.trend_strength || 50
      }))
    : [
        { text: "Breaking: Global Climate Summit Reaches Historic Agreement", strength: 95 },
        { text: "Tech: AI Revolution Transforms Healthcare Industry", strength: 88 },
        { text: "Markets: Record Tech Sector Growth Continues", strength: 92 },
        { text: "Sports: Championship Finals Draw Record Viewership", strength: 85 },
        { text: "Science: Breakthrough in Renewable Energy Technology", strength: 90 },
      ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/30">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent gradient-animate" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl" />
      </div>

      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center gap-4">
          {/* Label with pulse effect */}
          <div className="flex items-center gap-2 text-primary font-semibold text-sm whitespace-nowrap">
            <div className="relative">
              <TrendingUp className="h-4 w-4 animate-pulse" />
              <Zap className="h-3 w-3 absolute -top-1 -right-1 text-primary/70 animate-pulse" />
            </div>
            <span className="glow-text">LIVE TRENDING</span>
          </div>

          {/* Ticker content with multiple lanes */}
          <div className="flex-1 overflow-hidden">
            {/* Fast lane */}
            <div className="flex gap-12 ticker-scroll-fast mb-1">
              {[...topicsToDisplay, ...topicsToDisplay, ...topicsToDisplay].map((item, i) => (
                <div key={`fast-${i}`} className="flex items-center gap-2 whitespace-nowrap group cursor-pointer">
                  <span className={`text-sm font-medium transition-all duration-300 group-hover:text-primary ${
                    item.strength > 90 ? 'text-primary' : ''
                  }`}>
                    {item.text}
                  </span>
                  {item.strength > 85 && (
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary">HOT</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
    </div>
  );
};
