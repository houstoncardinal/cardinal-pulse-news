import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialShareProps {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
}

export const SocialShare = ({ articleId, articleTitle, articleUrl }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const trackShare = async (platform: string) => {
    await supabase.from('article_shares').insert({
      article_id: articleId,
      user_id: user?.id || null,
      platform: platform,
      referral_code: user ? `ref_${user.id.slice(0, 8)}` : null
    });
  };

  const shareOnTwitter = async () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank');
    await trackShare('twitter');
  };

  const shareOnFacebook = async () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank');
    await trackShare('facebook');
  };

  const shareOnLinkedIn = async () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
    window.open(url, '_blank');
    await trackShare('linkedin');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackShare('copy_link');
      toast({
        title: "Link copied!",
        description: "Share this article with your friends",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-red-950/20 to-black/20 rounded-lg border border-red-600/20">
      <Share2 className="h-5 w-5 text-red-400" />
      <span className="font-semibold text-sm">Share:</span>
      
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={shareOnTwitter}
          className="hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={shareOnFacebook}
          className="hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={shareOnLinkedIn}
          className="hover:bg-blue-700/20 hover:text-blue-400 transition-colors"
        >
          <Linkedin className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={copyLink}
          className={cn(
            "hover:bg-red-500/20 transition-colors",
            copied && "text-green-400"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
