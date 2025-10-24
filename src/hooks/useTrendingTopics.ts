import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTrendingTopics = () => {
  return useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .order('trend_strength', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
