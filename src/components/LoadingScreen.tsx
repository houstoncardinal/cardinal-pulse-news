import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Immediate hide after minimal delay
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 100);

    return () => clearTimeout(timer);
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
