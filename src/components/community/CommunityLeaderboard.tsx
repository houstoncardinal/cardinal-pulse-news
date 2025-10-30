import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, MessageSquare, Share2, ThumbsUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  reputation_points: number;
  total_comments: number;
  total_shares: number;
  total_likes: number;
  badges: any[];
  rank: number;
}

export const CommunityLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('community_leaderboard')
      .select('*')
      .limit(10);

    if (!error && data) {
      setLeaders(data as any);
    }
    setIsLoading(false);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-600 to-amber-500";
    if (rank === 2) return "from-gray-400 to-gray-500";
    if (rank === 3) return "from-orange-600 to-orange-700";
    return "from-zinc-700 to-zinc-800";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className="h-5 w-5" />;
    return rank;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-black via-zinc-900 to-black border-red-600/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Community Leaders</h2>
          <p className="text-sm text-red-200/60">Top contributors this week</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader) => (
            <div
              key={leader.user_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all hover:scale-[1.02]",
                leader.rank <= 3
                  ? "bg-gradient-to-r border-white/20 shadow-lg"
                  : "bg-zinc-800/50 border-white/10"
              )}
              style={leader.rank <= 3 ? {
                backgroundImage: `linear-gradient(135deg, ${getRankColor(leader.rank)})`
              } : undefined}
            >
              {/* Rank */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg",
                leader.rank <= 3 ? "bg-black/30 text-white" : "bg-red-600/20 text-red-400"
              )}>
                {getRankIcon(leader.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-white/20">
                {leader.avatar_url ? (
                  <img src={leader.avatar_url} alt={leader.username} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-red-600 text-white font-bold">
                    {leader.username[0]?.toUpperCase()}
                  </div>
                )}
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="font-bold text-white">
                  {leader.display_name || leader.username}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {leader.reputation_points} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {leader.total_comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {leader.total_shares}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {leader.total_likes}
                  </span>
                </div>
              </div>

              {/* Badges */}
              {leader.badges && leader.badges.length > 0 && (
                <div className="flex gap-1">
                  {leader.badges.slice(0, 3).map((badge: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
