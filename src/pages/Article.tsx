import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { ArticleContent } from "@/components/ArticleContent";
import { ImageAttribution } from "@/components/ImageAttribution";
import { AdSense } from "@/components/AdSense";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Calendar, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { CommentsSection } from "@/components/community/CommentsSection";
import { SocialShare } from "@/components/community/SocialShare";
import { NewsletterSignup } from "@/components/community/NewsletterSignup";
import { CommunityLeaderboard } from "@/components/community/CommunityLeaderboard";

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

  const baseUrl = "https://www.cardinal-news.com";
  const shareUrl = `${baseUrl}/article/${article.slug}`;
  const shareText = article.title;
  const canonicalUrl = shareUrl;
  const publishDate = new Date(article.published_at || article.created_at);
  const modifiedDate = new Date(article.date_modified || article.updated_at);
  
  // Ensure absolute URLs for images
  const getAbsoluteImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return `${baseUrl}/logo.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${baseUrl}${imageUrl}`;
  };
  
  const shareImage = getAbsoluteImageUrl(article.og_image || article.image_url || article.featured_image);
  const shareTitle = article.og_title || article.meta_title || article.title;
  const shareDescription = article.og_description || article.meta_description || article.excerpt || article.title;

  return (
    <div className="min-h-screen bg-background">
      {article && (
        <>
          <SchemaOrg type="article" article={article} url={canonicalUrl} />
          <Helmet>
            {/* Primary Meta Tags */}
            <title>{article.meta_title || article.title} | Cardinal News</title>
            <meta name="title" content={article.meta_title || article.title} />
            <meta name="description" content={article.meta_description || article.excerpt} />
            <meta name="keywords" content={article.meta_keywords?.join(", ")} />
            <meta name="author" content={article.author || "Cardinal AI"} />
            <link rel="canonical" href={canonicalUrl} />
            
            {/* Google News specific */}
            <meta name="news_keywords" content={article.news_keywords?.join(", ") || article.meta_keywords?.join(", ")} />
            <meta name="syndication-source" content="https://www.cardinal-news.com" />
            <meta name="original-source" content={canonicalUrl} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="article" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content="Cardinal News" />
            <meta property="og:title" content={shareTitle} />
            <meta property="og:description" content={shareDescription} />
            <meta property="og:image" content={shareImage} />
            <meta property="og:image:secure_url" content={shareImage} />
            <meta property="og:image:type" content="image/jpeg" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="675" />
            <meta property="og:image:alt" content={article.title} />
            <meta property="article:published_time" content={article.published_at || article.created_at} />
            <meta property="article:modified_time" content={article.date_modified || article.updated_at} />
            <meta property="article:author" content={article.author || "Cardinal AI"} />
            <meta property="article:section" content={article.category} />
            {article.tags?.map((tag: string) => (
              <meta key={tag} property="article:tag" content={tag} />
            ))}
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@cardinalnews" />
            <meta name="twitter:creator" content="@cardinalnews" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={shareTitle} />
            <meta name="twitter:description" content={shareDescription} />
            <meta name="twitter:image" content={shareImage} />
            <meta name="twitter:image:alt" content={article.title} />
            
            {/* Additional Social Media Tags */}
            <meta property="og:determiner" content="a" />
            <meta property="og:rich_attachment" content="true" />
            <meta name="pinterest:description" content={shareDescription} />
            <meta name="pinterest:media" content={shareImage} />
            <meta name="linkedin:author" content={article.author || "Cardinal AI"} />
            
            {/* WhatsApp & Telegram */}
            <meta property="og:video" content="" />
            <meta property="og:audio" content="" />
            
            {/* Additional SEO */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta property="og:locale" content="en_US" />
            
            {/* Google News Tags */}
            <meta name="standout" content={canonicalUrl} />
            <meta name="original-source" content={canonicalUrl} />
            <meta name="article:published_time" content={publishDate.toISOString()} />
            <meta name="article:modified_time" content={modifiedDate.toISOString()} />
            <meta name="publish_date" content={publishDate.toISOString()} />
            
            {/* Pagination & Canonical */}
            <link rel="alternate" type="application/rss+xml" title="Cardinal News RSS Feed" href="https://www.cardinal-news.com/rss.xml" />
            
            {/* Mobile Optimization */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
            <meta name="theme-color" content="#dc2626" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          </Helmet>
        </>
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
        {(article.featured_image || article.image_url) && (
          <div className="mb-8">
            <div className="rounded-lg overflow-hidden">
              <img 
                src={article.featured_image || article.image_url} 
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
            <ImageAttribution credit={article.image_credit} />
          </div>
        )}

        {/* Ad Space - Horizontal Banner */}
        <div className="mb-8 flex justify-center">
          <AdSense slot="1234567890" format="horizontal" />
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
            <ArticleContent content={article.content} />

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
            <SocialShare
              articleId={article.id}
              articleTitle={article.title}
              articleUrl={shareUrl}
            />

            {/* Comments Section */}
            <CommentsSection articleId={article.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Community Leaderboard */}
            <div className="sticky top-24 space-y-6">
              <CommunityLeaderboard />
              <NewsletterSignup />
              
              {/* Ad Space - Sidebar */}
              <AdSense slot="9876543210" format="vertical" style={{ minHeight: '600px' }} />
            </div>
          </div>
        </div>

        {/* Ad Space - Bottom Banner */}
        <div className="mt-12 flex justify-center">
          <AdSense slot="1122334455" format="horizontal" />
        </div>
      </article>

      <Footer />
      <MobileToolbar />
    </div>
  );
};

export default Article;
