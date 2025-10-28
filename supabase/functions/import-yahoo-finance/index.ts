import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooFinanceArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content?: string;
  guid: string;
  category?: string[];
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'finance', limit = 10, autoPublish = false } = await req.json();

    console.log('Fetching Yahoo Finance news for category:', category);

    // Yahoo Finance RSS feed URLs
    const rssFeeds: Record<string, string> = {
      finance: 'https://finance.yahoo.com/news/rssindex',
      stocks: 'https://finance.yahoo.com/news/topic/stock-market-news',
      crypto: 'https://finance.yahoo.com/topic/crypto/',
      economy: 'https://finance.yahoo.com/topic/economic-news/',
      earnings: 'https://finance.yahoo.com/topic/earnings/',
    };

    const feedUrl = rssFeeds[category] || rssFeeds.finance;
    
    console.log('Fetching from RSS feed:', feedUrl);
    
    // Fetch RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('RSS feed fetched, parsing XML...');

    // Parse RSS XML
    const articles = parseRSSFeed(xmlText, limit);
    console.log(`Parsed ${articles.length} articles from feed`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const importedArticles = [];

    for (const article of articles) {
      try {
        console.log(`Processing article: ${article.title}`);

        // Generate a slug from the title
        const slug = generateSlug(article.title);

        // Check if article already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          console.log(`Article already exists: ${slug}`);
          continue;
        }

        // Prepare article data
        const articleData = {
          title: article.title,
          slug: slug,
          excerpt: article.description.substring(0, 300),
          content: formatArticleContent(article),
          category: mapCategoryToCardinal(category),
          author: article.source || 'Yahoo Finance',
          tags: article.category || ['finance', 'business'],
          meta_title: article.title,
          meta_description: article.description.substring(0, 160),
          meta_keywords: article.category || ['finance', 'business', 'yahoo finance'],
          og_title: article.title,
          og_description: article.description.substring(0, 200),
          status: autoPublish ? 'published' : 'draft',
          published_at: autoPublish ? new Date().toISOString() : null,
          sources: [
            {
              name: 'Yahoo Finance',
              url: article.link,
              date: article.pubDate
            }
          ],
          news_keywords: article.category?.join(', '),
        };

        // Insert article
        const { data: inserted, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select()
          .single();

        if (error) {
          console.error(`Error inserting article: ${error.message}`);
          continue;
        }

        console.log(`Article imported successfully: ${inserted.id}`);
        importedArticles.push(inserted);
      } catch (error) {
        console.error(`Error processing article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedArticles.length,
        total: articles.length,
        articles: importedArticles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in import-yahoo-finance function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseRSSFeed(xml: string, limit: number): YahooFinanceArticle[] {
  const articles: YahooFinanceArticle[] = [];
  
  // Extract items using regex (simple parser for RSS)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xml.matchAll(itemRegex);

  let count = 0;
  for (const match of matches) {
    if (count >= limit) break;
    
    const itemXml = match[1];
    
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');
    const guid = extractTag(itemXml, 'guid');
    
    // Extract categories
    const categoryMatches = itemXml.matchAll(/<category>(.*?)<\/category>/g);
    const categories = Array.from(categoryMatches, m => m[1]);

    if (title && link) {
      articles.push({
        title: cleanText(title),
        link: cleanText(link),
        pubDate: cleanText(pubDate),
        description: cleanText(description),
        guid: cleanText(guid),
        category: categories.length > 0 ? categories : undefined,
        source: 'Yahoo Finance',
      });
      count++;
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function generateSlug(title: string): string {
  const randomId = Math.random().toString(36).substring(2, 8);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + `-${randomId}`;
}

function formatArticleContent(article: YahooFinanceArticle): string {
  return `
<article class="yahoo-finance-import">
  <header>
    <p class="source-attribution"><strong>Source:</strong> <a href="${article.link}" target="_blank" rel="noopener noreferrer">Yahoo Finance</a></p>
    <p class="publish-date"><strong>Published:</strong> ${new Date(article.pubDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
  </header>

  <section class="article-body">
    <p>${article.description}</p>
    
    ${article.category && article.category.length > 0 ? `
    <div class="article-tags">
      <strong>Topics:</strong> ${article.category.map(cat => `<span class="tag">${cat}</span>`).join(' ')}
    </div>
    ` : ''}

    <div class="read-more">
      <p><strong>Read the full article on Yahoo Finance:</strong></p>
      <p><a href="${article.link}" target="_blank" rel="noopener noreferrer" class="external-link">${article.link}</a></p>
    </div>
  </section>

  <footer class="article-footer">
    <p class="disclaimer"><em>This article was imported from Yahoo Finance and may be edited by Cardinal News editors for clarity and context.</em></p>
  </footer>
</article>
  `.trim();
}

function mapCategoryToCardinal(yahooCategory: string): string {
  const mapping: Record<string, string> = {
    'finance': 'business',
    'stocks': 'business',
    'crypto': 'technology',
    'economy': 'business',
    'earnings': 'business',
  };
  
  return mapping[yahooCategory] || 'business';
}
