import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudDrizzle, Wind } from "lucide-react";

interface AnimatedWeatherIconProps {
  condition: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export const AnimatedWeatherIcon = ({ 
  condition, 
  size = "md", 
  animate = true 
}: AnimatedWeatherIconProps) => {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-20 w-20"
  };

  const iconSize = sizeMap[size];
  const lower = condition.toLowerCase();

  // Rain conditions
  if (lower.includes('rain') || lower.includes('drizzle')) {
    return (
      <div className="relative">
        <CloudRain 
          className={`${iconSize} text-blue-500 ${animate ? 'animate-pulse' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-8 left-2 w-1 h-2 bg-blue-400 rounded-full animate-bounce" 
                 style={{ animationDelay: '0s', animationDuration: '1s' }} />
            <div className="absolute top-8 left-5 w-1 h-2 bg-blue-400 rounded-full animate-bounce" 
                 style={{ animationDelay: '0.2s', animationDuration: '1s' }} />
            <div className="absolute top-8 left-8 w-1 h-2 bg-blue-400 rounded-full animate-bounce" 
                 style={{ animationDelay: '0.4s', animationDuration: '1s' }} />
          </>
        )}
      </div>
    );
  }

  // Snow conditions
  if (lower.includes('snow')) {
    return (
      <div className="relative">
        <CloudSnow 
          className={`${iconSize} text-blue-200 ${animate ? 'animate-pulse' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-8 left-2 w-2 h-2 bg-white rounded-full animate-bounce opacity-70" 
                 style={{ animationDelay: '0s', animationDuration: '2s' }} />
            <div className="absolute top-10 left-5 w-2 h-2 bg-white rounded-full animate-bounce opacity-70" 
                 style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
            <div className="absolute top-9 left-8 w-2 h-2 bg-white rounded-full animate-bounce opacity-70" 
                 style={{ animationDelay: '1s', animationDuration: '2s' }} />
          </>
        )}
      </div>
    );
  }

  // Storm conditions
  if (lower.includes('storm') || lower.includes('thunder')) {
    return (
      <div className="relative">
        <CloudLightning 
          className={`${iconSize} text-yellow-500 ${animate ? 'animate-pulse' : ''}`} 
        />
        {animate && (
          <div className="absolute top-10 left-4 animate-ping">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm transform rotate-12" />
          </div>
        )}
      </div>
    );
  }

  // Clear conditions
  if (lower.includes('clear') || lower.includes('sunny')) {
    return (
      <div className="relative">
        <Sun 
          className={`${iconSize} text-yellow-400 ${animate ? 'animate-spin' : ''}`}
          style={{ animationDuration: '20s' }}
        />
        {animate && (
          <>
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse" 
                 style={{ animationDuration: '2s' }} />
          </>
        )}
      </div>
    );
  }

  // Windy conditions
  if (lower.includes('wind')) {
    return (
      <div className="relative overflow-hidden">
        <Wind 
          className={`${iconSize} text-gray-400 ${animate ? 'animate-pulse' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-3 -left-4 w-8 h-0.5 bg-gray-300 animate-[slide_2s_ease-in-out_infinite]" />
            <div className="absolute top-6 -left-4 w-6 h-0.5 bg-gray-300 animate-[slide_2s_ease-in-out_infinite]" 
                 style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>
    );
  }

  // Cloudy (default)
  return (
    <Cloud 
      className={`${iconSize} text-gray-400 ${animate ? 'animate-pulse' : ''}`} 
    />
  );
};
