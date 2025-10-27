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
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Real-Time Trends</h3>
            <p className="text-xs text-muted-foreground">
              Auto-refreshes every hour • Click to update now
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Trends
        </Button>
      </div>
    </Card>
  );
};
