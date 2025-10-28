import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";

interface NewsWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoHide?: boolean;
}

export const NewsWidget = ({ 
  position = 'bottom-right', 
  autoHide = true 
}: NewsWidgetProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: topics } = useTrendingTopics();

  // Auto-rotate every 10 seconds
  useEffect(() => {
    if (!topics || topics.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topics.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [topics]);

  // Auto-hide after 30 seconds if enabled
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setIsVisible(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [autoHide]);

  if (!isVisible || !topics || topics.length === 0) return null;

  const currentTopic = topics[currentIndex];

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-in-right`}
    >
      <div className="relative bg-card border border-primary/30 rounded-xl shadow-2xl shadow-primary/20 overflow-hidden backdrop-blur-xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent gradient-animate" />
        
        {/* Content */}
        <div className="relative p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Breaking Now
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* News Content */}
          <div className="space-y-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              {currentTopic.category?.toUpperCase() || 'NEWS'}
            </Badge>
            
            <h3 className="font-display font-bold text-sm leading-tight line-clamp-2">
              {currentTopic.topic}
            </h3>

            {currentTopic.keywords && currentTopic.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentTopic.keywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              {currentIndex + 1} of {topics.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => window.open('/watch', '_blank')}
            >
              Full View
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-1">
            {topics.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/30 rounded-full blur-2xl" />
      </div>
    </div>
  );
};
