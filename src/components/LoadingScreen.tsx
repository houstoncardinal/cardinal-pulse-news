import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide immediately when DOM is ready (much faster)
    if (document.readyState === 'complete') {
      setIsVisible(false);
      return;
    }

    const handleLoad = () => {
      // Small delay for smooth transition
      setTimeout(() => setIsVisible(false), 200);
    };

    window.addEventListener('load', handleLoad);
    
    // Fallback: hide after max 800ms even if load event doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsVisible(false);
    }, 800);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Simple, fast-loading spinner */}
        <div className="relative h-16 w-16">
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
          </div>
        </div>

        {/* Clean brand name */}
        <h1 className="text-2xl font-bold text-foreground font-display">
          Cardinal News
        </h1>
      </div>
    </div>
  );
};
