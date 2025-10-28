import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Scanning for duplicate articles...');

    // Get all published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, content, created_at, word_count')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const duplicates: any[] = [];
    const seen = new Map<string, any>();

    for (const article of articles || []) {
      const titleWords = new Set(
        article.title
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
      );

      let foundDuplicate = false;
      
      for (const [existingId, existingArticle] of seen.entries()) {
        const existingWords = new Set(
          existingArticle.title
            .toLowerCase()
            .split(/\s+/)
            .filter((word: string) => word.length > 3)
        );

        const titleWordsArray = Array.from(titleWords) as string[];
        const commonWords = titleWordsArray.filter((word: string) => existingWords.has(word));
        const similarity = commonWords.length / Math.max(titleWords.size, existingWords.size);

        if (similarity > 0.7) {
          console.log(`Found duplicate: "${article.title}" similar to "${existingArticle.title}" (${(similarity * 100).toFixed(1)}% match)`);
          
          // Keep the better quality article (higher word count)
          const keepArticle = article.word_count > existingArticle.word_count ? article : existingArticle;
          const removeArticle = article.word_count > existingArticle.word_count ? existingArticle : article;
          
          duplicates.push({
            kept: {
              id: keepArticle.id,
              title: keepArticle.title,
              word_count: keepArticle.word_count
            },
            removed: {
              id: removeArticle.id,
              title: removeArticle.title,
              word_count: removeArticle.word_count
            },
            similarity: (similarity * 100).toFixed(1) + '%'
          });

          foundDuplicate = true;
          break;
        }
      }

      if (!foundDuplicate) {
        seen.set(article.id, article);
      }
    }

    console.log(`Found ${duplicates.length} duplicate(s)`);

    // Return the list of duplicates without deleting
    return new Response(
      JSON.stringify({ 
        success: true,
        duplicatesFound: duplicates.length,
        duplicates 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error checking duplicates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
