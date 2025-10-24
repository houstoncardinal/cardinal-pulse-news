import { TrendingUp } from "lucide-react";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";

export const TrendingTicker = () => {
  const { data: topics } = useTrendingTopics();
  
  const topicsToDisplay = topics && topics.length > 0 
    ? topics.map(t => `${t.category?.toUpperCase() || 'NEWS'}: ${t.topic}`)
    : [
        "Breaking: Global Climate Summit Reaches Historic Agreement",
        "Tech: AI Revolution Transforms Healthcare Industry",
        "Markets: Record Tech Sector Growth Continues",
        "Sports: Championship Finals Draw Record Viewership",
        "Science: Breakthrough in Renewable Energy Technology",
      ];

  return (
    <div className="bg-primary/10 border-y border-primary/20 overflow-hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm whitespace-nowrap">
            <TrendingUp className="h-4 w-4" />
            <span>TRENDING NOW</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8 animate-scroll">
              {[...topicsToDisplay, ...topicsToDisplay].map((topic, i) => (
                <span key={i} className="text-sm whitespace-nowrap">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
};
