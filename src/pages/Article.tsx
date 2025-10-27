import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Calendar, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const Article = () => {
  const { slug } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (article) {
      // Increment view count
      supabase
        .from('articles')
        .update({ views_count: (article.views_count || 0) + 1 })
        .eq('id', article.id)
        .then();
    }
  }, [article]);

  // Generate NewsArticle schema for Google News
  const generateSchema = () => {
    if (!article) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt || article.meta_description,
      "image": article.image_url || article.featured_image,
      "datePublished": article.published_at || article.created_at,
      "dateModified": article.date_modified || article.updated_at,
      "author": {
        "@type": "Person",
        "name": article.author || "Cardinal AI"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cardinal News",
        "logo": {
          "@type": "ImageObject",
          "url": window.location.origin + "/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      },
      "articleSection": article.category,
      "keywords": article.meta_keywords?.join(", "),
      "wordCount": article.word_count
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const shareUrl = window.location.href;
  const shareText = article.title;
  const schema = generateSchema();

  return (
    <div className="min-h-screen bg-background">
      {article && (
        <Helmet>
          {/* Primary Meta Tags */}
          <title>{article.meta_title || article.title} | Cardinal News</title>
          <meta name="title" content={article.meta_title || article.title} />
          <meta name="description" content={article.meta_description || article.excerpt} />
          <meta name="keywords" content={article.meta_keywords?.join(", ")} />
          <meta name="author" content={article.author || "Cardinal AI"} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="article" />
          <meta property="og:url" content={shareUrl} />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={article.excerpt || article.meta_description} />
          <meta property="og:image" content={article.image_url || article.featured_image} />
          <meta property="article:published_time" content={article.published_at || article.created_at} />
          <meta property="article:modified_time" content={article.date_modified || article.updated_at} />
          <meta property="article:author" content={article.author || "Cardinal AI"} />
          <meta property="article:section" content={article.category} />
          {article.tags?.map((tag: string) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
          
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={shareUrl} />
          <meta property="twitter:title" content={article.title} />
          <meta property="twitter:description" content={article.excerpt || article.meta_description} />
          <meta property="twitter:image" content={article.image_url || article.featured_image} />
          
          {/* Schema.org NewsArticle */}
          {schema && (
            <script type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          )}
        </Helmet>
      )}
      
      <Header />
      
      <article className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/?category=${article.category}`} className="hover:text-primary capitalize">{article.category}</Link>
          <span className="mx-2">/</span>
          <span>{article.title}</span>
        </div>

        {/* Category Badge */}
        <Badge className="mb-4 bg-primary hover:bg-primary/90 text-base">
          {article.category?.toUpperCase()}
        </Badge>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b">
          <span className="font-medium">By {article.author}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(article.published_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {article.read_time}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            {article.views_count || 0} views
          </span>
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img 
              src={article.featured_image} 
              alt={article.title}
              className="w-full h-auto object-cover"
            />
            {article.image_credit && (
              <p className="text-xs text-muted-foreground mt-2">Photo credit: {article.image_credit}</p>
            )}
          </div>
        )}

        {/* Ad Space - Horizontal Banner */}
        <div className="mb-8 bg-muted/20 border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Advertisement Space (728x90)</p>
          <p className="text-xs text-muted-foreground mt-2">Google AdSense code goes here</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 font-medium leading-relaxed border-l-4 border-primary pl-6">
                {article.excerpt}
              </p>
            )}

            {/* Article Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b">
                <span className="font-semibold mr-2">Tags:</span>
                {article.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div className="mb-8">
              <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share This Article
              </h3>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <a 
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ad Space - Sidebar */}
            <div className="bg-muted/20 border-2 border-dashed border-muted rounded-lg p-8 text-center sticky top-24">
              <p className="text-muted-foreground">Advertisement Space (300x600)</p>
              <p className="text-xs text-muted-foreground mt-2">Google AdSense code goes here</p>
            </div>
          </div>
        </div>

        {/* Ad Space - Bottom Banner */}
        <div className="mt-12 bg-muted/20 border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Advertisement Space (728x90)</p>
          <p className="text-xs text-muted-foreground mt-2">Google AdSense code goes here</p>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default Article;
