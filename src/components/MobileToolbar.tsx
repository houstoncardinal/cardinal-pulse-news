import { Home, Newspaper, Music, Film, Calendar, TrendingUp, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const toolbarItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "Trending", path: "/category/trending" },
  { icon: Music, label: "Music", path: "/category/music" },
  { icon: Film, label: "Movies", path: "/category/movies" },
  { icon: Calendar, label: "Events", path: "/category/events" },
  { icon: Globe, label: "World", path: "/category/world" },
];

export const MobileToolbar = () => {
  const location = useLocation();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind toolbar */}
      <div className="h-20 md:hidden" />
      
      {/* Fixed bottom toolbar - only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-6 h-16">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-200 relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:scale-95"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-lg m-1" />
                )}
                <Icon className={cn(
                  "h-6 w-6 relative z-10 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold relative z-10",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
