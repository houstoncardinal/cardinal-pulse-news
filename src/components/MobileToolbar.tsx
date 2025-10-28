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
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-6 h-16">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
