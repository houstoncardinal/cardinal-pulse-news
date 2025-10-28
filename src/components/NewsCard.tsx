import { Clock, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  readTime: string;
  views: string;
  slug?: string;
  featured?: boolean;
}

export const NewsCard = ({
  title,
  excerpt,
  category,
  image,
  author,
  readTime,
  views,
  slug,
  featured = false,
}: NewsCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const fallbackImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070";
  
  const content = (
    <>
      <div className={`relative overflow-hidden ${featured ? "h-96" : "h-48"} group-hover:shadow-2xl transition-shadow duration-500 bg-muted`}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        
        <img
          src={imageError ? fallbackImage : image}
          alt={title}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/70 transition-colors duration-500" />
        
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 gradient-animate" />
        
        <Badge className="absolute top-4 left-4 bg-primary hover:bg-primary/90 animate-scale-in backdrop-blur-sm shadow-lg glow-pulse">
          {category}
        </Badge>

        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />
        </div>
      </div>

      <div className="p-6 relative">
        <h3
          className={`font-display font-bold mb-3 group-hover:text-primary transition-all duration-300 story-link ${
            featured ? "text-3xl" : "text-xl"
          }`}
        >
          {title}
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-2 group-hover:text-foreground transition-colors duration-300">{excerpt}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          <span className="font-medium">{author}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
              <Clock className="h-3 w-3 group-hover:text-primary transition-colors" />
              {readTime}
            </span>
            <span className="flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
              <Eye className="h-3 w-3 group-hover:text-primary transition-colors" />
              {views}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return slug ? (
    <Link to={`/article/${slug}`}>
      <Card
        className={`luxury-card group overflow-hidden border border-border hover:border-primary/50 transition-all duration-500 cursor-pointer hover-scale relative ${
          featured ? "md:col-span-2 md:row-span-2" : ""
        }`}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-xl" />
        </div>
        {content}
      </Card>
    </Link>
  ) : (
    <Card
      className={`luxury-card group overflow-hidden border border-border hover:border-primary/50 transition-all duration-500 cursor-pointer hover-scale relative ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-xl" />
      </div>
      {content}
    </Card>
  );
};
