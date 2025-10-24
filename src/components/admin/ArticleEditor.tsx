import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, CheckCircle, X, ImageIcon } from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  category: string;
  status: string;
  image_url?: string;
  image_credit?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  tags?: string[];
  sources?: any[];
  word_count?: number;
  author?: string;
}

interface ArticleEditorProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ArticleEditor = ({ article, isOpen, onClose, onSave }: ArticleEditorProps) => {
  const [editedArticle, setEditedArticle] = useState<Article>(article);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title: editedArticle.title,
          excerpt: editedArticle.excerpt,
          content: editedArticle.content,
          meta_title: editedArticle.meta_title,
          meta_description: editedArticle.meta_description,
          meta_keywords: editedArticle.meta_keywords,
          tags: editedArticle.tags,
          image_credit: editedArticle.image_credit,
        })
        .eq('id', article.id);

      if (error) throw error;

      toast({
        title: "✅ Article Saved!",
        description: "Your changes have been saved successfully.",
      });
      
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const { error } = await supabase.functions.invoke('publish-article', {
        body: { articleId: article.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "📰 Article Published!",
        description: "Article is now live with full SEO optimization.",
      });
      
      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish article",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof Article, value: any) => {
    setEditedArticle(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-display">Edit Article</DialogTitle>
              <DialogDescription>
                Make changes to your article and publish when ready
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                {article.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {editedArticle.image_url && (
              <Card className="p-4">
                <Label className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4" />
                  Hero Image
                </Label>
                <img 
                  src={editedArticle.image_url} 
                  alt={editedArticle.title}
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
                <Input
                  value={editedArticle.image_credit || ''}
                  onChange={(e) => updateField('image_credit', e.target.value)}
                  placeholder="Image credit/attribution"
                />
              </Card>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedArticle.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="text-lg font-bold"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={editedArticle.excerpt || ''}
                onChange={(e) => updateField('excerpt', e.target.value)}
                rows={2}
                placeholder="Brief summary of the article"
              />
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={editedArticle.content || ''}
                onChange={(e) => updateField('content', e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editedArticle.category}
                  onChange={(e) => updateField('category', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={editedArticle.author || 'Cardinal AI'}
                  onChange={(e) => updateField('author', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={editedArticle.tags?.join(', ') || ''}
                onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()))}
                placeholder="technology, AI, innovation"
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={editedArticle.meta_title || ''}
                onChange={(e) => updateField('meta_title', e.target.value)}
                placeholder="SEO-optimized title (max 60 chars)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editedArticle.meta_title?.length || 0} / 60 characters
              </p>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={editedArticle.meta_description || ''}
                onChange={(e) => updateField('meta_description', e.target.value)}
                rows={3}
                placeholder="SEO-optimized description (max 160 chars)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editedArticle.meta_description?.length || 0} / 160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords (comma separated)</Label>
              <Input
                id="meta_keywords"
                value={editedArticle.meta_keywords?.join(', ') || ''}
                onChange={(e) => updateField('meta_keywords', e.target.value.split(',').map(k => k.trim()))}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            {editedArticle.sources && editedArticle.sources.length > 0 && (
              <Card className="p-4">
                <Label className="mb-2 block">Sources Cited</Label>
                <div className="space-y-2">
                  {editedArticle.sources.map((source: any, idx: number) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.name}
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card className="p-6">
              {editedArticle.image_url && (
                <img 
                  src={editedArticle.image_url} 
                  alt={editedArticle.title}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-4xl font-display font-bold mb-4">{editedArticle.title}</h1>
              {editedArticle.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">{editedArticle.excerpt}</p>
              )}
              <div className="flex items-center gap-2 mb-6">
                <Badge>{editedArticle.category}</Badge>
                {editedArticle.tags?.map((tag, i) => (
                  <Badge key={i} variant="outline">{tag}</Badge>
                ))}
              </div>
              <div className="prose prose-lg max-w-none">
                {(editedArticle.content || '').split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          {article.status !== 'published' && (
            <Button onClick={handlePublish} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Publish Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};