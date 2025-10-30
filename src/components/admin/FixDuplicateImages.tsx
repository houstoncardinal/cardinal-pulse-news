import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FixDuplicateImages = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const fixDuplicateImages = async () => {
    if (!confirm("This will delete all articles with duplicate or generic images. Continue?")) {
      return;
    }

    setIsFixing(true);
    setProgress("Scanning for duplicate images...");

    try {
      const { data, error } = await supabase.functions.invoke('fix-duplicate-images');

      if (error) throw error;

      if (data.success) {
        toast.success(`Fixed ${data.fixed} articles with duplicate/problematic images`);
        setProgress(`✓ Deleted ${data.fixed} articles`);
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to fix duplicate images');
      }

    } catch (error: any) {
      console.error('Error fixing images:', error);
      toast.error(error.message || 'Failed to fix duplicate images');
      setProgress("❌ Failed to fix images");
    } finally {
      setTimeout(() => {
        setIsFixing(false);
        setProgress("");
      }, 3000);
    }
  };

  return (
    <Card className="border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageOff className="h-5 w-5 text-orange-500" />
          Fix Duplicate Images
        </CardTitle>
        <CardDescription>
          Removes articles using duplicate or generic stock images to keep your content unique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {progress}
          </div>
        )}
        <Button
          onClick={fixDuplicateImages}
          disabled={isFixing}
          variant="outline"
          className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
          size="lg"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Duplicates...
            </>
          ) : (
            <>
              <ImageOff className="mr-2 h-4 w-4" />
              Remove Duplicate/Generic Images
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          This will:
          <br />• Remove articles with images used more than once
          <br />• Remove articles with generic stock photos
          <br />• Clean up business file/document images
        </p>
      </CardContent>
    </Card>
  );
};
