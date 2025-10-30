import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CleanupArticles = () => {
  const [isClearing, setIsClearing] = useState(false);

  const cleanupArticles = async () => {
    if (!confirm("Are you sure you want to delete all articles without images? This action cannot be undone.")) {
      return;
    }

    setIsClearing(true);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-articles');

      if (error) throw error;

      if (data.success) {
        toast.success(`Deleted ${data.deleted} articles without images`);
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to cleanup articles');
      }

    } catch (error: any) {
      console.error('Error cleaning up articles:', error);
      toast.error(error.message || 'Failed to cleanup articles');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Cleanup Articles
        </CardTitle>
        <CardDescription>
          Remove articles that don't have images. Use this to clean up incomplete articles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={cleanupArticles}
          disabled={isClearing}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          {isClearing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cleaning Up...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Articles Without Images
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
