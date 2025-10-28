import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

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

    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'main';
    const baseUrl = 'https://www.cardinal-news.com';

    if (sitemapType === 'news') {
      // Google News Sitemap - Last 48 hours only
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: articles, error } = await supabase
        .from('articles')
        .select('slug, title, published_at, updated_at, category, excerpt, meta_keywords')
        .eq('status', 'published')
        .gte('published_at', twoDaysAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${articles?.map(article => `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Cardinal News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${article.published_at}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${escapeXml(article.meta_keywords?.join(', ') || '')}</news:keywords>
      <news:stock_tickers>${escapeXml(extractStockTickers(article.meta_keywords || []))}</news:stock_tickers>
    </news:news>
    <lastmod>${article.updated_at || article.published_at}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`).join('\n')}
</urlset>`;

      console.log('Generated Google News sitemap with', articles?.length || 0, 'recent articles');
      
      return new Response(newsSitemap, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
        },
      });
    }

    // Main Sitemap - All published articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    // Static pages
    const staticPages = [
      { loc: baseUrl, priority: '1.0', changefreq: 'hourly' },
      { loc: `${baseUrl}/weather`, priority: '0.8', changefreq: 'hourly' },
    ];

    // Category pages
    const categories = [
      'world', 'business', 'technology', 'sports', 
      'entertainment', 'music', 'movies', 'events',
      'science', 'politics', 'ai-innovation', 'lifestyle'
    ];
    const categoryPages = categories.map(cat => ({
      loc: `${baseUrl}/category/${cat}`,
      priority: '0.8',
      changefreq: 'daily'
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${categoryPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${articles?.map(article => {
  // Calculate priority based on article age
  const publishDate = new Date(article.published_at);
  const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  let priority = '0.7';
  let changefreq = 'weekly';
  
  if (daysSincePublish < 1) {
    priority = '0.9';
    changefreq = 'hourly';
  } else if (daysSincePublish < 7) {
    priority = '0.8';
    changefreq = 'daily';
  }

  return `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${article.updated_at || article.published_at}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    console.log('Generated main sitemap with', articles?.length || 0, 'articles');

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractStockTickers(keywords: string[]): string {
  // Extract potential stock tickers (uppercase 1-5 letter words)
  const tickers = keywords
    .filter(k => /^[A-Z]{1,5}$/.test(k))
    .join(', ');
  return tickers;
}
