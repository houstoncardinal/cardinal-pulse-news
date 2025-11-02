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
          Automatically finds and replaces duplicate or missing images with unique, properly sourced images for each article.
          Each image will include proper citation credits.
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
          <p className="font-semibold">This will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Find all articles with missing images</li>
            <li>Find all articles using duplicate images</li>
            <li>Fetch unique, relevant images for each article</li>
            <li>Add proper image credits and citations</li>
            <li>Validate images match article content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
