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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const baseUrl = "https://www.cardinal-news.com";

    // Fetch all published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    // Build XML sitemap
    const urls: string[] = [];

    // Add homepage
    urls.push(`
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`);

    // Add category pages
    const categories = [
      'world', 'business', 'technology', 'sports', 
      'entertainment', 'science', 'politics', 'ai-innovation'
    ];

    categories.forEach(category => {
      urls.push(`
  <url>
    <loc>${baseUrl}/category/${category}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`);
    });

    // Add article pages
    articles?.forEach(article => {
      const lastmod = article.updated_at || article.published_at;
      urls.push(`
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <news:news>
      <news:publication>
        <news:name>Cardinal News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.published_at).toISOString()}</news:publication_date>
      <news:title>${article.slug.replace(/-/g, ' ')}</news:title>
    </news:news>
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
