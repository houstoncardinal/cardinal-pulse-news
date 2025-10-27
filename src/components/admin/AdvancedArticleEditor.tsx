import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Save, 
  X, 
  Image as ImageIcon, 
  Link2, 
  Plus, 
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  Upload,
  Tag,
  Sparkles
} from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Source {
  name: string;
  url: string;
}

interface ArticleEditorProps {
  article: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AdvancedArticleEditor = ({ article, isOpen, onClose, onSave }: ArticleEditorProps) => {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    category: article?.category || 'world',
    tags: article?.tags || [],
    meta_title: article?.meta_title || '',
    meta_description: article?.meta_description || '',
    meta_keywords: article?.meta_keywords || [],
    image_url: article?.image_url || '',
    image_credit: article?.image_credit || '',
    sources: article?.sources || [],
    author: article?.author || 'Cardinal AI'
  });

  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'world', 'business', 'technology', 'sports', 
    'entertainment', 'science', 'politics', 'ai_innovation', 'lifestyle'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.title) {
      toast.error('Please add a title first');
      return;
    }

    setIsGeneratingImage(true);
    const loadingToast = toast.loading('Generating AI image...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-article-image', {
        body: {
          articleId: article.id,
          title: formData.title,
          content: formData.content,
          category: formData.category
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        image_url: data.imageUrl,
        image_credit: data.credit
      }));

      toast.success('AI image generated successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Generate image error:', error);
      toast.error('Failed to generate image', { id: loadingToast });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddKeyword = () => {
    if (newKeyword && !formData.meta_keywords.includes(newKeyword)) {
      setFormData(prev => ({ ...prev, meta_keywords: [...prev.meta_keywords, newKeyword] }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({ 
      ...prev, 
      meta_keywords: prev.meta_keywords.filter(k => k !== keyword) 
    }));
  };

  const handleAddSource = () => {
    if (newSource.name && newSource.url) {
      setFormData(prev => ({ ...prev, sources: [...prev.sources, newSource] }));
      setNewSource({ name: '', url: '' });
    }
  };

  const handleRemoveSource = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      sources: prev.sources.filter((_, i) => i !== index) 
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;

      const { error } = await supabase
        .from('articles')
        .update({
          ...formData,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id);

      if (error) throw error;

      toast.success('Article saved successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          ...formData,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', article.id);

      if (error) throw error;

      toast.success('Article published successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish article');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Advanced Article Editor
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter article title..."
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary of the article..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  className="min-h-[400px]"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Featured Image</Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || !formData.title}
                      variant="default"
                      className="gap-2"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate AI Image
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      variant="outline"
                      className="gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {formData.image_url && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={formData.image_url}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Image URL (Optional)</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Or paste image URL..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image Credit</Label>
                  <Input
                    value={formData.image_credit}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_credit: e.target.value }))}
                    placeholder="Photo credit / source..."
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (60 chars recommended)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description (160 chars recommended)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.meta_keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="gap-1">
                      {keyword}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveKeyword(keyword)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={newSource.name}
                    onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Source name..."
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newSource.url}
                      onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="Source URL..."
                    />
                    <Button onClick={handleAddSource} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.sources.map((source: Source, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSource(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card className="p-6">
              <article className="prose max-w-none">
                <div className="mb-6">
                  <Badge className="mb-4">{formData.category}</Badge>
                  <h1 className="text-4xl font-bold mb-4">{formData.title || 'Untitled Article'}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{formData.excerpt}</p>
                  <p className="text-sm text-muted-foreground">By {formData.author}</p>
                </div>

                {formData.image_url && (
                  <img src={formData.image_url} alt={formData.title} className="w-full rounded-lg mb-6" />
                )}

                <div dangerouslySetInnerHTML={{ __html: formData.content }} />

                {formData.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-bold mb-4">Sources</h3>
                    <ul className="space-y-2">
                      {formData.sources.map((source: Source, index: number) => (
                        <li key={index}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {source.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={isSaving}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Publish Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
