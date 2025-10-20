import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-news.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Global news network studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <Badge className="mb-6 bg-primary hover:bg-primary/90 text-base px-4 py-1">
            BREAKING NEWS
          </Badge>
          
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            AI-Powered Global News Network Launches Worldwide
          </h2>
          
          <p className="text-xl text-platinum-silver mb-8 leading-relaxed">
            Cardinal News delivers real-time trending stories from around the globe, 
            powered by advanced AI technology and journalistic excellence.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2 text-base px-8">
              Read Full Story
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8">
              Explore Trending
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
