import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UpdateAuthorButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ updated: number; failed: number } | null>(null);

  const updateAllAuthors = async () => {
    setIsUpdating(true);
    setResult(null);
    
    try {
      toast.loading("Updating all articles to Hunain Qureshi...");

      // Get all articles that need updating
      const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, author')
        .or('author.eq.Cardinal AI,author.is.null');

      if (fetchError) throw fetchError;

      if (!articles || articles.length === 0) {
        toast.success("All articles already have the correct author!");
        setIsUpdating(false);
        return;
      }

      console.log(`Found ${articles.length} articles to update`);

      // Update each article individually
      let updated = 0;
      let failed = 0;

      for (const article of articles) {
        try {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ author: 'Hunain Qureshi' })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Failed to update article ${article.id}:`, updateError);
            failed++;
          } else {
            updated++;
            console.log(`✓ Updated: ${article.title}`);
          }
        } catch (err) {
          console.error(`Error updating article ${article.id}:`, err);
          failed++;
        }
      }

      setResult({ updated, failed });
      
      if (failed === 0) {
        toast.success(`Successfully updated ${updated} articles to Hunain Qureshi!`);
      } else {
        toast.warning(`Updated ${updated} articles, ${failed} failed`);
      }

    } catch (error) {
      console.error('Error updating authors:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update articles');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={updateAllAuthors}
          disabled={isUpdating}
          className="gap-2"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              Update All Articles to Hunain Qureshi
            </>
          )}
        </Button>
      </div>

      {result && (
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Update Complete:</p>
              <p>✓ Successfully updated: {result.updated} articles</p>
              {result.failed > 0 && (
                <p className="text-destructive">✗ Failed: {result.failed} articles</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        This will update all existing articles to show "Hunain Qureshi" as the author.
        All new articles will automatically use this author name.
      </p>
    </div>
  );
};
