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
          className={`${iconSize} text-blue-500 ${animate ? 'animate-weather-float' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-8 left-2 w-1 h-3 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-rain-fall" 
                 style={{ animationDelay: '0s' }} />
            <div className="absolute top-8 left-5 w-1 h-3 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-rain-fall" 
                 style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-8 left-8 w-1 h-3 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-rain-fall" 
                 style={{ animationDelay: '0.4s' }} />
            <div className="absolute top-9 left-3 w-1 h-3 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-rain-fall" 
                 style={{ animationDelay: '0.3s' }} />
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
          className={`${iconSize} text-blue-200 ${animate ? 'animate-weather-float' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-8 left-2 w-2 h-2 bg-white rounded-full animate-bounce opacity-90 shadow-lg" 
                 style={{ animationDelay: '0s', animationDuration: '2.5s' }} />
            <div className="absolute top-10 left-5 w-2 h-2 bg-white rounded-full animate-bounce opacity-90 shadow-lg" 
                 style={{ animationDelay: '0.7s', animationDuration: '2.5s' }} />
            <div className="absolute top-9 left-8 w-2 h-2 bg-white rounded-full animate-bounce opacity-90 shadow-lg" 
                 style={{ animationDelay: '1.4s', animationDuration: '2.5s' }} />
            <div className="absolute top-11 left-4 w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce opacity-70" 
                 style={{ animationDelay: '0.3s', animationDuration: '3s' }} />
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
          className={`${iconSize} text-yellow-500 ${animate ? 'animate-weather-float' : ''}`} 
        />
        {animate && (
          <>
            <div className="absolute top-10 left-4 animate-ping">
              <div className="w-3 h-4 bg-yellow-400 rounded-sm transform rotate-12 shadow-lg shadow-yellow-500/50" />
            </div>
            <div className="absolute top-9 left-5 animate-pulse opacity-70" style={{ animationDuration: '0.5s' }}>
              <div className="w-2 h-3 bg-yellow-300 rounded-sm transform -rotate-6" />
            </div>
          </>
        )}
      </div>
    );
  }

  // Clear conditions
  if (lower.includes('clear') || lower.includes('sunny')) {
    return (
      <div className="relative">
        <Sun 
          className={`${iconSize} text-yellow-400 ${animate ? 'animate-spin-slow' : ''}`}
        />
        {animate && (
          <>
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-400/30 to-transparent animate-pulse-glow" />
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
            <div className="absolute top-3 -left-8 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
            <div className="absolute top-6 -left-8 w-10 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" 
                 style={{ animationDelay: '0.7s' }} />
            <div className="absolute top-9 -left-8 w-8 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" 
                 style={{ animationDelay: '1.4s' }} />
          </>
        )}
      </div>
    );
  }

  // Cloudy (default)
  return (
    <div className="relative">
      <Cloud 
        className={`${iconSize} text-gray-400 ${animate ? 'animate-cloud-drift' : ''}`} 
      />
      {animate && (
        <div className="absolute inset-0 rounded-full bg-gray-400/10 animate-pulse" 
             style={{ animationDuration: '4s' }} />
      )}
    </div>
  );
};
