import { Clock, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  readTime: string;
  views: string;
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
  featured = false,
}: NewsCardProps) => {
  return (
    <Card
      className={`luxury-card group overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? "h-96" : "h-48"}`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <Badge className="absolute top-4 left-4 bg-primary hover:bg-primary/90">
          {category}
        </Badge>
      </div>

      <div className="p-6">
        <h3
          className={`font-display font-bold mb-3 group-hover:text-primary transition-colors ${
            featured ? "text-3xl" : "text-xl"
          }`}
        >
          {title}
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{excerpt}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{author}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {views}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
