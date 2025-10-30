import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ThumbsUp, Reply, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_comment_id: string | null;
  likes_count: number;
  created_at: string;
  user_profile: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  is_liked: boolean;
}

export const CommentsSection = ({ articleId }: { articleId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('article_comments')
      .select(`
        *,
        user_profile:user_profiles(username, display_name, avatar_url)
      `)
      .eq('article_id', articleId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data as any);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('article_comments')
      .insert({
        article_id: articleId,
        user_id: user.id,
        content: newComment,
        parent_comment_id: replyTo
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      setReplyTo(null);
      loadComments();
      toast({
        title: "Success",
        description: "Comment posted!",
      });
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like comments",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id
      });

    if (!error) {
      loadComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      loadComments();
      toast({
        title: "Success",
        description: "Comment deleted",
      });
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Community Discussion</h2>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* Comment Form */}
      <div className="mb-8 p-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border/50">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Share your thoughts..." : "Sign in to join the discussion"}
          className="mb-3 min-h-[100px]"
          disabled={!user || isSubmitting}
        />
        <div className="flex justify-between items-center">
          {replyTo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
            >
              Cancel Reply
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!user || !newComment.trim() || isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg bg-gradient-to-br from-background to-muted/10 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 bg-primary/10">
                  {comment.user_profile?.avatar_url ? (
                    <img src={comment.user_profile.avatar_url} alt={comment.user_profile.username} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-primary font-bold">
                      {comment.user_profile?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {comment.user_profile?.display_name || comment.user_profile?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(comment.id)}
                      disabled={!user}
                      className={cn(
                        "gap-1",
                        comment.is_liked && "text-primary"
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {comment.likes_count > 0 && comment.likes_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(comment.id)}
                      disabled={!user}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    {user && user.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        className="text-destructive ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
