import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-news.jpg";
import { useArticles } from "@/hooks/useArticles";

export const Hero = () => {
  const { data: articles } = useArticles();
  const featuredArticle = articles?.[0];

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden animate-fade-in">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={featuredArticle?.featured_image || heroImage}
          alt={featuredArticle?.title || "Global news network studio"}
          className="w-full h-full object-cover animate-scale-in"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <Badge className="mb-6 bg-primary hover:bg-primary/90 text-base px-4 py-1 animate-scale-in">
            {featuredArticle?.category?.toUpperCase() || 'BREAKING NEWS'}
          </Badge>
          
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight animate-fade-in text-wrap">
            {featuredArticle?.title || 'AI-Powered Global News Network Launches Worldwide'}
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-platinum-silver mb-6 md:mb-8 leading-relaxed animate-fade-in text-wrap" style={{ animationDelay: '0.2s' }}>
            {featuredArticle?.excerpt || 'Cardinal News delivers real-time trending stories from around the globe, powered by advanced AI technology and journalistic excellence.'}
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {featuredArticle?.slug && (
              <Button size="lg" className="gap-2 text-base px-8 hover-scale" asChild>
                <Link to={`/article/${featuredArticle.slug}`}>
                  Read Full Story
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
