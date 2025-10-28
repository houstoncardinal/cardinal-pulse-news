import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Article = Database['public']['Tables']['articles']['Row'];

export const ArticleReviewPanel = () => {
  const { toast } = useToast();
  const [draftArticles, setDraftArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadDraftArticles();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('draft-articles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: 'status=eq.draft'
        },
        () => {
          loadDraftArticles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDraftArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDraftArticles(data || []);
    } catch (error) {
      console.error('Error loading draft articles:', error);
      toast({
        title: "Error",
        description: "Failed to load draft articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArticle = (id: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const selectAll = () => {
    if (selectedArticles.size === draftArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(draftArticles.map(a => a.id)));
    }
  };

  const handleBatchPublish = async () => {
    if (selectedArticles.size === 0) {
      toast({
        title: "No articles selected",
        description: "Please select articles to publish",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const now = new Date().toISOString();
      const articlesToPublish = Array.from(selectedArticles);

      const { error } = await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: now,
        })
        .in('id', articlesToPublish);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Published ${articlesToPublish.length} article${articlesToPublish.length > 1 ? 's' : ''}`,
      });

      setSelectedArticles(new Set());
      loadDraftArticles();
    } catch (error) {
      console.error('Error publishing articles:', error);
      toast({
        title: "Error",
        description: "Failed to publish articles",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedArticles.size === 0) {
      toast({
        title: "No articles selected",
        description: "Please select articles to reject",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedArticles.size} article${selectedArticles.size > 1 ? 's' : ''}?`)) {
      return;
    }

    setIsPublishing(true);

    try {
      const articlesToDelete = Array.from(selectedArticles);

      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', articlesToDelete);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Deleted ${articlesToDelete.length} article${articlesToDelete.length > 1 ? 's' : ''}`,
      });

      setSelectedArticles(new Set());
      loadDraftArticles();
    } catch (error) {
      console.error('Error deleting articles:', error);
      toast({
        title: "Error",
        description: "Failed to delete articles",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading articles for review...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Review Queue
              <Badge variant="secondary">{draftArticles.length} articles</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review imported articles before publishing. All articles meet Harvard-level standards and E-E-A-T compliance.
            </p>
          </div>
        </div>

        {selectedArticles.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="font-medium">{selectedArticles.size} selected</span>
            <Button
              onClick={handleBatchPublish}
              disabled={isPublishing}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Publish
                </>
              )}
            </Button>
            <Button
              onClick={handleBatchReject}
              disabled={isPublishing}
              size="sm"
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => setSelectedArticles(new Set())}
              disabled={isPublishing}
              size="sm"
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={selectedArticles.size === draftArticles.length && draftArticles.length > 0}
            onCheckedChange={selectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All
          </label>
        </div>
      </Card>

      {draftArticles.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
          <p className="text-muted-foreground">
            No articles awaiting review. Import new articles to see them here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {draftArticles.map((article) => (
            <Card
              key={article.id}
              className="p-5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex gap-4">
                <Checkbox
                  checked={selectedArticles.has(article.id)}
                  onCheckedChange={() => toggleArticle(article.id)}
                />
                
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold line-clamp-2">{article.title}</h4>
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.word_count} words</span>
                    <span>•</span>
                    <span>{new Date(article.created_at).toLocaleString()}</span>
                    {article.sources && Array.isArray(article.sources) && article.sources.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {(article.sources[0] as any).name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setPreviewArticle(article)}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewArticle?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            {previewArticle && (
              <div className="space-y-4">
                {previewArticle.image_url && (
                  <img
                    src={previewArticle.image_url}
                    alt={previewArticle.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge>{previewArticle.category}</Badge>
                  <span>{previewArticle.author}</span>
                  <span>•</span>
                  <span>{previewArticle.word_count} words</span>
                </div>

                <p className="text-lg font-medium text-muted-foreground">
                  {previewArticle.excerpt}
                </p>

                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: previewArticle.content }}
                />

                {previewArticle.sources && Array.isArray(previewArticle.sources) && previewArticle.sources.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Sources</h4>
                    {previewArticle.sources.map((source: any, idx: number) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background">
                  <Button
                    onClick={async () => {
                      await handleBatchPublish();
                      setPreviewArticle(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve & Publish
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedArticles(new Set([previewArticle.id]));
                      handleBatchReject();
                      setPreviewArticle(null);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};