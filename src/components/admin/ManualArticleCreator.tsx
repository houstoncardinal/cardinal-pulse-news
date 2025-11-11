import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Upload, X, Plus, Save, Eye, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

const categories = [
  "world", "business", "technology", "entertainment", "sports",
  "science", "lifestyle", "politics", "ai_innovation"
] as const;

type ArticleCategory = typeof categories[number];

export const ManualArticleCreator = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  
  // Article Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("Hunain Qureshi");
  const [category, setCategory] = useState<ArticleCategory>("world");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [imageCredit, setImageCredit] = useState("");
  
  // Tags/Hashtags
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // SEO Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [newsKeywords, setNewsKeywords] = useState("");
  
  // Schema Markup
  const [schemaMarkup, setSchemaMarkup] = useState("");

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFetchImage = async () => {
    if (!title.trim()) {
      toast.error("Please provide a title first");
      return;
    }

    setIsFetchingImage(true);
    const loadingToast = toast.loading("Fetching professional image from news sources...");

    try {
      const { data, error } = await supabase.functions.invoke('fetch-news-image', {
        body: { 
          topic: title,
          category: category 
        }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        setImagePreview(data.imageUrl);
        setImageCredit(data.imageCredit || 'Professional News Source');
        toast.success("Image sourced from professional news outlet!", { id: loadingToast });
      } else {
        toast.error("No suitable image found. Please upload manually.", { id: loadingToast });
      }
    } catch (error) {
      console.error('Image fetch error:', error);
      toast.error('Failed to fetch image: ' + (error instanceof Error ? error.message : 'Unknown error'), { id: loadingToast });
    } finally {
      setIsFetchingImage(false);
    }
  };

  const handleAutoPopulate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content first");
      return;
    }

    setIsAutoPopulating(true);
    const loadingToast = toast.loading("Auto-populating article fields...");

    try {
      const { data, error } = await supabase.functions.invoke('auto-populate-article-fields', {
        body: { title, content }
      });

      if (error) throw error;

      // Populate all fields
      setSlug(data.slug);
      setCategory(data.category as ArticleCategory);
      setExcerpt(data.excerpt);
      setTags(data.tags || []);
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
      setMetaKeywords(data.metaKeywords);
      setNewsKeywords(data.newsKeywords);
      setOgTitle(data.ogTitle);
      setOgDescription(data.ogDescription);
      setSchemaMarkup(data.schemaMarkup);

      toast.success("All fields auto-populated successfully!", { id: loadingToast });
    } catch (error) {
      console.error('Auto-populate error:', error);
      toast.error('Failed to auto-populate fields: ' + (error instanceof Error ? error.message : 'Unknown error'), { id: loadingToast });
    } finally {
      setIsAutoPopulating(false);
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "";
      
      // Use preview image if it's from fetch-news-image, otherwise upload file
      if (imagePreview && !imageFile) {
        // Image from news sources
        imageUrl = imagePreview;
      } else if (imageFile) {
        // Upload manually selected image
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('article-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Parse schema markup if provided
      let parsedSchema = null;
      if (schemaMarkup.trim()) {
        try {
          parsedSchema = JSON.parse(schemaMarkup);
        } catch (e) {
          toast.error("Invalid JSON in schema markup");
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate word count and read time
      const wordCount = content.trim().split(/\s+/).length;
      const readTime = calculateReadTime(content);

      // Prepare article data
      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        content: content,
        excerpt: excerpt.trim() || content.substring(0, 200) + "...",
        author: author.trim(),
        category: category,
        status: publishNow ? "published" : status,
        published_at: publishNow ? new Date().toISOString() : null,
        image_url: imageUrl || null,
        image_credit: imageCredit.trim() || null,
        featured_image: imageUrl || null,
        tags: tags.length > 0 ? tags : null,
        meta_title: metaTitle.trim() || title.trim(),
        meta_description: metaDescription.trim() || excerpt.trim() || content.substring(0, 160),
        meta_keywords: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : null,
        og_title: ogTitle.trim() || title.trim(),
        og_description: ogDescription.trim() || excerpt.trim() || content.substring(0, 200),
        og_image: imageUrl || null,
        news_keywords: newsKeywords ? newsKeywords.split(',').map(k => k.trim()) : null,
        schema_markup: parsedSchema,
        word_count: wordCount,
        read_time: readTime,
      };

      const { data: article, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();

      if (error) throw error;

      toast.success(publishNow ? "Article published successfully!" : "Article saved as draft!");
      
      // Reset form
      setTitle("");
      setSlug("");
      setContent("");
      setExcerpt("");
      setAuthor("Hunain Qureshi");
      setCategory("world");
      setStatus("draft");
      setImageFile(null);
      setImagePreview("");
      setImageCredit("");
      setTags([]);
      setMetaTitle("");
      setMetaDescription("");
      setMetaKeywords("");
      setOgTitle("");
      setOgDescription("");
      setNewsKeywords("");
      setSchemaMarkup("");

      // Navigate to article if published
      if (publishNow && article?.slug) {
        setTimeout(() => navigate(`/article/${article.slug}`), 1500);
      }

    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <FileEdit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Manual Article Creator</h3>
          <p className="text-sm text-muted-foreground">Create and publish articles with full control</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Auto-populate Button */}
        {title.trim() && content.trim() && (
          <Button
            onClick={handleAutoPopulate}
            disabled={isAutoPopulating}
            variant="outline"
            className="w-full border-primary/50 hover:bg-primary/10"
          >
            <Sparkles className={`h-4 w-4 mr-2 ${isAutoPopulating ? 'animate-spin' : ''}`} />
            {isAutoPopulating ? "Auto-populating..." : "Auto-populate All Fields"}
          </Button>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter article title..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-url-slug"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Auto-generated from title. Edit if needed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ArticleCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').charAt(0).toUpperCase() + cat.replace(/_/g, ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Article Content *</Label>
          <div className="mt-1.5 bg-background rounded-md">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Write your article content here..."
              className="min-h-[300px]"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="excerpt">Excerpt / Summary</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the article (optional, will be auto-generated if left empty)"
            rows={3}
            className="mt-1.5"
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label htmlFor="image">Featured Image</Label>
          <div className="mt-1.5 space-y-3">
            {/* Auto-fetch Image Button */}
            {title.trim() && !imagePreview && (
              <Button
                onClick={handleFetchImage}
                disabled={isFetchingImage}
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10"
                type="button"
              >
                <Sparkles className={`h-4 w-4 mr-2 ${isFetchingImage ? 'animate-spin' : ''}`} />
                {isFetchingImage ? "Fetching Professional Image..." : "Auto-Fetch Image from News Sources"}
              </Button>
            )}

            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    setImageCredit("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                {imageCredit && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {imageCredit}
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
                </div>
                <input
                  id="image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            )}
            <Input
              placeholder="Image credit (auto-filled if using news source)"
              value={imageCredit}
              onChange={(e) => setImageCredit(e.target.value)}
            />
          </div>
        </div>

        {/* Tags/Hashtags */}
        <div>
          <Label htmlFor="tags">Tags / Hashtags</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag and press Enter"
            />
            <Button type="button" onClick={addTag} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* SEO Fields */}
        <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
          <h4 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            SEO & Social Media
          </h4>
          
          <div>
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO title (defaults to article title)"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="meta-desc">Meta Description</Label>
            <Textarea
              id="meta-desc"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO description (max 160 characters)"
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="meta-keywords">Meta Keywords</Label>
            <Input
              id="meta-keywords"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="news-keywords">News Keywords</Label>
            <Input
              id="news-keywords"
              value={newsKeywords}
              onChange={(e) => setNewsKeywords(e.target.value)}
              placeholder="news keyword1, news keyword2"
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="og-title">Open Graph Title</Label>
              <Input
                id="og-title"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="Social media title"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="og-desc">Open Graph Description</Label>
              <Input
                id="og-desc"
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Social media description"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Schema Markup */}
        <div>
          <Label htmlFor="schema">Schema Markup (JSON-LD)</Label>
          <Textarea
            id="schema"
            value={schemaMarkup}
            onChange={(e) => setSchemaMarkup(e.target.value)}
            placeholder='{"@context": "https://schema.org", "@type": "NewsArticle", ...}'
            rows={4}
            className="mt-1.5 font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: Add custom schema.org structured data</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isSubmitting ? "Publishing..." : "Publish Now"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
