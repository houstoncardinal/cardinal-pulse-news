-- Create community tables for viral growth

-- User profiles with engagement tracking
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  reputation_points INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments system
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment likes tracking
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Article shares tracking
CREATE TABLE IF NOT EXISTS public.article_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  referral_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User bookmarks
CREATE TABLE IF NOT EXISTS public.article_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{"daily": true, "weekly": true, "breaking": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community leaderboard view
CREATE OR REPLACE VIEW public.community_leaderboard AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  reputation_points,
  total_comments,
  total_shares,
  total_likes,
  badges,
  ROW_NUMBER() OVER (ORDER BY reputation_points DESC) as rank
FROM public.user_profiles
ORDER BY reputation_points DESC
LIMIT 100;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Anyone can view profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.article_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.article_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.article_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.article_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON public.article_comments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Article shares policies
CREATE POLICY "Anyone can view shares" ON public.article_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can create shares" ON public.article_shares FOR INSERT WITH CHECK (true);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON public.article_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON public.article_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON public.article_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Newsletter policies
CREATE POLICY "Users can view their own subscription" ON public.newsletter_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own subscription" ON public.newsletter_subscribers FOR UPDATE USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_comments_updated_at
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update user reputation
CREATE OR REPLACE FUNCTION public.update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'article_comments' THEN
      UPDATE public.user_profiles 
      SET total_comments = total_comments + 1,
          reputation_points = reputation_points + 5
      WHERE user_id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'comment_likes' THEN
      UPDATE public.user_profiles 
      SET total_likes = total_likes + 1,
          reputation_points = reputation_points + 2
      WHERE user_id = (SELECT user_id FROM public.article_comments WHERE id = NEW.comment_id);
    ELSIF TG_TABLE_NAME = 'article_shares' THEN
      IF NEW.user_id IS NOT NULL THEN
        UPDATE public.user_profiles 
        SET total_shares = total_shares + 1,
            reputation_points = reputation_points + 3
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'article_comments' THEN
      UPDATE public.user_profiles 
      SET total_comments = total_comments - 1,
          reputation_points = GREATEST(reputation_points - 5, 0)
      WHERE user_id = OLD.user_id;
    ELSIF TG_TABLE_NAME = 'comment_likes' THEN
      UPDATE public.user_profiles 
      SET total_likes = total_likes - 1,
          reputation_points = GREATEST(reputation_points - 2, 0)
      WHERE user_id = (SELECT user_id FROM public.article_comments WHERE id = OLD.comment_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply reputation triggers
CREATE TRIGGER comment_reputation_trigger
  AFTER INSERT OR DELETE ON public.article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation();

CREATE TRIGGER like_reputation_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation();

CREATE TRIGGER share_reputation_trigger
  AFTER INSERT ON public.article_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation();