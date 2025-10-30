import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const RegenerateImages = () => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const regenerateImages = async () => {
    setIsRegenerating(true);
    setProgress("Starting image regeneration...");

    try {
      const { data, error } = await supabase.functions.invoke('regenerate-article-images', {
        body: { articleIds: null } // null = regenerate all articles without images
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully regenerated images for ${data.updated} articles!`);
        setProgress(`✓ Complete: ${data.updated}/${data.total} articles updated`);
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to regenerate images');
      }

    } catch (error: any) {
      console.error('Error regenerating images:', error);
      toast.error(error.message || 'Failed to regenerate images');
      setProgress("❌ Failed to regenerate images");
    } finally {
      setTimeout(() => {
        setIsRegenerating(false);
        setProgress("");
      }, 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Regenerate Article Images
        </CardTitle>
        <CardDescription>
          Generate high-quality AI images for articles missing images. Uses advanced AI generation with fallback to news image search.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {progress}
          </div>
        )}
        <Button
          onClick={regenerateImages}
          disabled={isRegenerating}
          className="w-full"
          size="lg"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating Images...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Regenerate Missing Images
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          This will generate images for all articles that don't have one. The process uses:
          <br />• Real news image search first
          <br />• AI generation as fallback
          <br />• Aggressive filtering to avoid generic stock photos
        </p>
      </CardContent>
    </Card>
  );
};
