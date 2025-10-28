import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { SchemaOrg } from "@/components/seo/SchemaOrg";

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const { data: articles, isLoading } = useArticles();

  // Normalize category name for display
  const categoryName = category
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || '';

  // Filter articles by category
  const categoryArticles = articles?.filter(
    article => article.category.toLowerCase() === category?.toLowerCase().replace('-', '_')
  ) || [];

  const articlesToDisplay = categoryArticles.map(article => ({
    title: article.title,
    excerpt: article.excerpt || '',
    category: article.category,
    image: article.featured_image || article.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070",
    author: article.author || 'Cardinal AI',
    readTime: article.read_time || '5 min read',
    views: `${(article.views_count || 0).toLocaleString()}`,
    slug: article.slug,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="mb-8 relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Loading {categoryName} Stories
        </h2>
        <p className="text-muted-foreground">Fetching the latest articles...</p>
      </div>
    );
  }

  const canonicalUrl = `https://www.cardinal-news.com/category/${category}`;
  const categoryDescription = `Latest ${categoryName.toLowerCase()} news, breaking stories, analysis, and updates. Stay informed with comprehensive coverage from Cardinal News.`;

  return (
    <div className="min-h-screen bg-background">
      <SchemaOrg type="category" categoryName={categoryName} url={canonicalUrl} />
      <Helmet>
        <title>{categoryName} News - Cardinal News</title>
        <meta name="description" content={categoryDescription} />
        <meta name="keywords" content={`${categoryName.toLowerCase()} news, ${categoryName.toLowerCase()} updates, breaking ${categoryName.toLowerCase()} news, Cardinal News`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Cardinal News" />
        <meta property="og:title" content={`${categoryName} News - Cardinal News`} />
        <meta property="og:description" content={categoryDescription} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@cardinalnews" />
        <meta name="twitter:title" content={`${categoryName} News - Cardinal News`} />
        <meta name="twitter:description" content={categoryDescription} />
        
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Category Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {categoryName}
          </h1>
          <p className="text-lg text-muted-foreground">
            {articlesToDisplay.length} article{articlesToDisplay.length !== 1 ? 's' : ''} in this category
          </p>
        </div>

        {/* Articles Grid */}
        {articlesToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesToDisplay.map((article, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <NewsCard {...article} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">No Articles Yet</h2>
            <p className="text-muted-foreground mb-8">
              We haven't published any {categoryName.toLowerCase()} articles yet. Check back soon!
            </p>
            <Button asChild>
              <Link to="/">Browse All Articles</Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Category;
