import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrendingTicker } from "@/components/TrendingTicker";
import { NewsCard } from "@/components/NewsCard";
import { NewsWidget } from "@/components/NewsWidget";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useArticles } from "@/hooks/useArticles";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { SchemaOrg } from "@/components/seo/SchemaOrg";

const Index = () => {
  const { data: publishedArticles, isLoading } = useArticles();

  // Only show real AI-generated articles from the database
  const articlesToDisplay = publishedArticles && publishedArticles.length > 0 
    ? publishedArticles.map(article => ({
        title: article.title,
        excerpt: article.excerpt || '',
        category: article.category,
        image: article.featured_image || article.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070",
        author: article.author || 'Cardinal AI',
        readTime: article.read_time || '5 min read',
        views: `${(article.views_count || 0).toLocaleString()}`,
        slug: article.slug,
      }))
    : [];

  const featured = articlesToDisplay[0];
  // Exclude hero article from featured stories to prevent duplication
  const featuredArticles = articlesToDisplay.slice(1, 4);
  const latestArticles = articlesToDisplay.slice(4, 10);
  const hasRealArticles = articlesToDisplay.length > 0;

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
          Loading Your Newsroom
        </h2>
        <p className="text-muted-foreground">Fetching the latest AI-generated articles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SchemaOrg type="website" />
      <Helmet>
        <title>Cardinal News - Breaking News, Analysis & Insights</title>
        <meta name="description" content="Stay informed with Cardinal News. Breaking news, in-depth analysis, and comprehensive coverage of world events, business, technology, sports, politics, and entertainment. Your trusted source for real-time journalism." />
        <meta name="keywords" content="breaking news, world news, business news, technology news, sports news, politics, entertainment, AI journalism, real-time news, Cardinal News" />
        <link rel="canonical" href="https://www.cardinal-news.com/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cardinal-news.com/" />
        <meta property="og:site_name" content="Cardinal News" />
        <meta property="og:title" content="Cardinal News - Breaking News & Analysis" />
        <meta property="og:description" content="Your trusted source for breaking news, analysis, and insights on global events" />
        <meta property="og:image" content="https://www.cardinal-news.com/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@cardinalnews" />
        <meta name="twitter:title" content="Cardinal News - Breaking News & Analysis" />
        <meta name="twitter:description" content="Your trusted source for breaking news, analysis, and insights on global events" />
        <meta name="twitter:image" content="https://www.cardinal-news.com/og-image.png" />
        
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>
      
      <Header />
      <TrendingTicker />
      <Hero />
      
      {/* Smart Watch Widget - Shows on all devices */}
      <NewsWidget position="bottom-right" autoHide={false} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Real-time indicator badge */}
        {hasRealArticles && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold text-primary">Live • AI-Generated News</span>
            </div>
          </div>
        )}

        {articlesToDisplay.length > 0 ? (
          <>
            {/* Featured Section */}
            <section className="mb-16 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">Featured Stories</h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {articlesToDisplay.length} AI-Generated Article{articlesToDisplay.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Skip first article as it's shown in Hero */}
                {articlesToDisplay.slice(1, 2).map((article, i) => (
                  <div key={i} className="animate-fade-in md:col-span-2 md:row-span-2">
                    <NewsCard {...article} featured />
                  </div>
                ))}
                {articlesToDisplay.slice(2, 4).map((article, i) => (
                  <div key={i} className="animate-fade-in" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                    <NewsCard {...article} />
                  </div>
                ))}
              </div>
            </section>

            {/* Latest News - Show if more than 4 articles */}
            {articlesToDisplay.length > 4 && (
              <section className="mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display text-3xl md:text-4xl font-bold">Latest News</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Fresh from the newsroom</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articlesToDisplay.slice(4).map((article, i) => (
                    <div key={i} className="animate-fade-in" style={{ animationDelay: `${(i + 4) * 0.1}s` }}>
                      <NewsCard {...article} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-20 animate-fade-in max-w-2xl mx-auto">
            <div className="mb-8 relative">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-4 relative">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Breaking News Coming Soon
            </h2>
            
            <p className="text-muted-foreground mb-8 text-lg">
              Our newsroom is preparing the latest stories. Check back shortly for breaking news and updates.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/50">
                <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Real-Time Coverage</h3>
                  <p className="text-sm text-muted-foreground">
                    Get the latest news as it happens, 24/7
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Expert Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    In-depth reporting on the stories that matter
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Preview */}
        <section>
          <h2 className="font-display text-4xl font-bold mb-8">
            Explore by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "World", slug: "world", color: "from-blue-600 to-blue-800" },
              { name: "Business", slug: "business", color: "from-green-600 to-green-800" },
              { name: "Technology", slug: "technology", color: "from-purple-600 to-purple-800" },
              { name: "Sports", slug: "sports", color: "from-orange-600 to-orange-800" },
              { name: "Entertainment", slug: "entertainment", color: "from-pink-600 to-pink-800" },
              { name: "Science", slug: "science", color: "from-teal-600 to-teal-800" },
              { name: "Politics", slug: "politics", color: "from-red-600 to-red-800" },
              { name: "AI & Innovation", slug: "ai-innovation", color: "from-indigo-600 to-indigo-800" },
            ].map((category) => (
              <Link
                key={category.name}
                to={`/category/${category.slug}`}
                className={`relative h-32 rounded-lg overflow-hidden group cursor-pointer bg-gradient-to-br ${category.color} hover-scale`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="relative h-full flex items-center justify-center">
                  <h3 className="font-display text-xl font-bold text-white">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Global Weather Widget */}
      <WeatherWidget />

      <Footer />
      <MobileToolbar />
    </div>
  );
};

export default Index;
