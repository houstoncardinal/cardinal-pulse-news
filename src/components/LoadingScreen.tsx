import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loading screen after a minimum display time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Cardinal Logo */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 animate-pulse">
            <div className="h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
          </div>
          
          {/* Middle rotating ring */}
          <div className="relative h-24 w-24 animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary" />
          </div>
          
          {/* Inner pulsing core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary shadow-[0_0_40px_hsl(var(--primary)/0.5)]" />
          </div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="h-8 w-8 text-primary-foreground"
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
        </div>

        {/* Brand name with elegant animation */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold text-foreground animate-fade-in font-display tracking-tight">
            Cardinal News
          </h1>
          <div className="flex gap-1">
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground animate-fade-in [animation-delay:300ms] tracking-wide uppercase">
          Breaking News & Analysis
        </p>
      </div>
    </div>
  );
};
