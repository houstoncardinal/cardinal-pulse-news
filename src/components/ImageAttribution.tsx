interface ImageAttributionProps {
  credit: string | null;
  className?: string;
}

export const ImageAttribution = ({ credit, className = "" }: ImageAttributionProps) => {
  if (!credit) return null;

  const isAIGenerated = credit.toLowerCase().includes('ai generated') || 
                       credit.toLowerCase().includes('ai-generated');

  return (
    <div className={`text-xs text-muted-foreground mt-2 ${className}`}>
      {isAIGenerated && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 rounded">
          ⚠️ AI-Generated Image - Not Real Photography
        </span>
      )}
      {!isAIGenerated && (
        <span className="inline-flex items-center gap-1">
          Photo: {credit}
        </span>
      )}
    </div>
  );
};