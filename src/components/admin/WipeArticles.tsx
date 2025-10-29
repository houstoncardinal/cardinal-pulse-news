import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export const WipeArticles = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [articleCount, setArticleCount] = useState<number | null>(null);

  const checkArticleCount = async () => {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    setArticleCount(count || 0);
  };

  const handleWipeArticles = async () => {
    setIsDeleting(true);
    try {
      // Delete all articles
      const { error } = await supabase
        .from('articles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

      if (error) throw error;

      toast.success("All articles deleted successfully!");
      setArticleCount(0);
      
      // Reload the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting articles:', error);
      toast.error("Failed to delete articles: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Wipe All Articles
        </CardTitle>
        <CardDescription>
          Delete all existing articles to start fresh with new content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              onClick={checkArticleCount}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Articles
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This action cannot be undone. This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>{articleCount !== null ? articleCount : '...'}</strong> articles</li>
                  <li>All associated images</li>
                  <li>All article metadata</li>
                  <li>Article history records</li>
                </ul>
                <p className="text-destructive font-semibold mt-4">
                  You'll need to generate new articles after this operation.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWipeArticles}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
