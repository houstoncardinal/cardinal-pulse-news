interface ImageAttributionProps {
  credit: string | null;
  className?: string;
}

export const ImageAttribution = ({ credit, className = "" }: ImageAttributionProps) => {
  if (!credit) return null;

  const isAIGenerated = credit.toLowerCase().includes('ai generated') || 
                       credit.toLowerCase().includes('ai-generated');

  // Parse credit to extract source name and URL
  const parseCredit = (creditStr: string) => {
    // Format: "Source Name (URL)"
    const match = creditStr.match(/^(.+?)\s*\((https?:\/\/.+?)\)$/);
    if (match) {
      return { source: match[1].trim(), url: match[2].trim() };
    }
    return { source: creditStr, url: null };
  };

  const { source, url } = parseCredit(credit);

  return (
    <div className={`text-sm mt-3 p-3 bg-muted/50 rounded-lg border border-border/50 ${className}`}>
      {isAIGenerated ? (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 rounded">
          ⚠️ AI-Generated Image - Not Real Photography
        </span>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-semibold text-foreground">Image Source:</span>
          {url ? (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              {source}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <span className="font-medium">{source}</span>
          )}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Credible Source</span>
        </div>
      )}
    </div>
  );
};