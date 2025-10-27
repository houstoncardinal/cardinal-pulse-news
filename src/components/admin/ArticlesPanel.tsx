import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Edit, CheckCircle } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { useState } from "react";
import { AdvancedArticleEditor } from "./AdvancedArticleEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ArticlesPanel = () => {
  const { data: articles, isLoading } = useArticles();
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const handlePublish = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', articleId);

      if (error) throw error;
      
      toast.success('Article published successfully');
    } catch (error) {
      console.error('Error publishing article:', error);
      toast.error('Failed to publish article');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Published Articles</h2>
        
        <div className="grid gap-4">
          {articles?.map((article) => (
            <Card key={article.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {article.image_url && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      {article.image_credit && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                          {article.image_credit}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views_count} views
                      </span>
                      {article.word_count && <span>{article.word_count} words</span>}
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingArticle(article)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {article.status !== 'published' && (
                    <Button
                      onClick={() => handlePublish(article.id)}
                      size="sm"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {editingArticle && (
        <AdvancedArticleEditor
          article={editingArticle}
          isOpen={!!editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={() => {
            setEditingArticle(null);
            toast.success('Article updated');
          }}
        />
      )}
    </>
  );
};
