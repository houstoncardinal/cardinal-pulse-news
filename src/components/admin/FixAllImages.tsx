import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const FixAllImages = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();

  const handleFixImages = async () => {
    setIsProcessing(true);
    setProgress("Starting batch image update process...");

    try {
      toast({
        title: "Processing Started",
        description: "Finding and fixing all articles with duplicate or missing images...",
      });

      const { data, error } = await supabase.functions.invoke('fix-duplicate-and-missing-images');

      if (error) {
        throw error;
      }

      setProgress(`✅ Complete! Updated ${data.summary.successful} articles, ${data.summary.failed} failed`);

      toast({
        title: "Batch Update Complete",
        description: `Successfully updated ${data.summary.successful} articles with unique images`,
      });

      // Show detailed results
      if (data.details.failed.length > 0) {
        console.log('Failed articles:', data.details.failed);
        toast({
          title: "Some Articles Failed",
          description: `${data.details.failed.length} articles could not be updated. Check console for details.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error fixing images:', error);
      setProgress("❌ Process failed");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix images",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Fix All Article Images
        </CardTitle>
        <CardDescription>
          Scans ALL articles and replaces fallback/duplicate images with unique, real images from news sources or AI-generated images.
          Every image includes proper source attribution and credits. This may take several minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">{progress}</p>
          </div>
        )}
        
        <Button
          onClick={handleFixImages}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Articles...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Fix All Article Images
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-semibold">This powerful tool will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Scan ALL articles in your database</li>
            <li>Detect missing, duplicate, and fallback images</li>
            <li>Fetch unique news images from credible sources</li>
            <li>Generate AI images when real photos aren't available</li>
            <li>Add proper source attribution and credits</li>
            <li>Validate images match article content</li>
            <li>Update all image fields (featured, og_image, etc.)</li>
          </ul>
          <p className="mt-4 text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-3 rounded border border-yellow-500/20">
            ⚠️ This process may take 10-30 minutes depending on the number of articles. Please be patient.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
