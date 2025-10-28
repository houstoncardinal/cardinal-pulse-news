import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useTrendingTopics = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('trends-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trending_topics'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trending-topics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      // Get trends from the last 24 hours, prioritizing both recency and strength
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .gte('fetched_at', twentyFourHoursAgo.toISOString())
        .order('fetched_at', { ascending: false })
        .order('trend_strength', { ascending: false })
        .limit(15);

      if (error) throw error;
      
      // Sort by a combined score of recency and strength
      const scoredData = (data || []).map(topic => {
        const hoursSinceFetched = (Date.now() - new Date(topic.fetched_at).getTime()) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 100 - (hoursSinceFetched * 4)); // Decay over 24 hours
        const combinedScore = (topic.trend_strength * 0.6) + (recencyScore * 0.4);
        return { ...topic, combinedScore };
      });

      // Return top 10 by combined score
      return scoredData
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, 10);
    },
    refetchInterval: 60000, // Auto-refresh every minute to get latest trends
    refetchOnWindowFocus: true,
  });
};
