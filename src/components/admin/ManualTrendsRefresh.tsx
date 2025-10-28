import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ManualTrendsRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const loadingToast = toast.loading("Fetching latest trends from Google...");

    try {
      const { data, error } = await supabase.functions.invoke('fetch-trends', {
        body: { region: 'us', limit: 20 }
      });

      if (error) throw error;

      toast.success(`Successfully fetched ${data.topicsAdded} new trends!`, {
        id: loadingToast
      });
    } catch (error) {
      console.error('Error refreshing trends:', error);
      toast.error('Failed to refresh trends', { id: loadingToast });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="p-3 md:p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-xs md:text-sm truncate">Real-Time Trends</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
              Auto-refreshes every hour • Click to update now
            </p>
            <p className="text-[10px] text-muted-foreground sm:hidden">
              Auto-refreshes hourly
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          className="gap-2 w-full sm:w-auto h-9 text-xs"
        >
          <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Trends</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>
    </Card>
  );
};
