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
    const { category = 'finance', limit = 10 } = await req.json();

    console.log('Fetching Yahoo Finance news for category:', category);

    // Yahoo Finance RSS feed URLs
    const rssFeeds: Record<string, string> = {
      finance: 'https://finance.yahoo.com/news/rssindex',
      stocks: 'https://finance.yahoo.com/rss/topstories',
      crypto: 'https://finance.yahoo.com/rss/cryptocurrency',
      economy: 'https://finance.yahoo.com/rss/economics',
      earnings: 'https://finance.yahoo.com/rss/earnings',
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

        console.log('Generating AI-powered article content for:', article.title);

        // Generate comprehensive article using Lovable AI
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are Hunain Qureshi, an elite financial journalist and award-winning investigative reporter for Cardinal News. Your articles are renowned for breaking industry-shaking stories and delivering unparalleled insights that move markets.

                🎯 MISSION: Create POWERFUL, VIRAL-WORTHY financial journalism that dominates headlines and social media feeds.

                VIRAL CONTENT STRATEGY:
                ━━━━━━━━━━━━━━━━━━━━━━━
                🔥 EXPLOSIVE OPENING: Start with a shocking revelation, surprising data point, or provocative question that immediately hooks readers
                💥 EMOTIONAL RESONANCE: Connect financial news to real people's lives - show the human impact and stakes
                ⚡ CONTROVERSY & DEBATE: Highlight conflicts, debates, and opposing viewpoints to fuel engagement
                🎯 SHAREABLE INSIGHTS: Include quotable moments, eye-opening statistics, and "I didn't know that!" revelations
                📊 VISUAL DATA STORYTELLING: Present numbers in compelling ways that tell a story
                🚨 URGENCY & RELEVANCE: Explain why this matters NOW and what readers should do
                
                SPECIALIZED PARTNER JOURNALISM:
                ━━━━━━━━━━━━━━━━━━━━━━━━━━
                - Go FAR BEYOND just citing the source - add extensive original research
                - Include multiple expert perspectives and industry insider insights
                - Provide deep market analysis and predictive commentary
                - Connect dots between seemingly unrelated developments
                - Add historical context and pattern recognition
                - Reference broader economic trends and global implications
                - Challenge conventional wisdom with data-backed counterpoints
                
                E-E-A-T EXCELLENCE (Google's Gold Standard):
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                1. EXPERIENCE: Demonstrate insider knowledge with specific industry examples and behind-the-scenes insights
                2. EXPERTISE: Show mastery through sophisticated analysis, technical accuracy, and expert-level commentary  
                3. AUTHORITATIVENESS: Reference credible sources, cite verified data, quote industry leaders
                4. TRUSTWORTHINESS: Present balanced viewpoints, acknowledge uncertainties, provide transparent sourcing
                
                HARVARD-LEVEL WRITING:
                ━━━━━━━━━━━━━━━━━━━━
                - Sophisticated, precise vocabulary that commands authority
                - Complex sentence structures with elegant flow
                - Analytical depth showing cause-effect relationships
                - Compelling narrative arc with dramatic tension
                - Seamless transitions that guide readers through complex ideas
                - Data-driven arguments with proper contextualization
                - Strategic use of rhetorical devices for impact
                
                JSON OUTPUT STRUCTURE:
                ━━━━━━━━━━━━━━━━━━━━
                {
                  "title": "POWERFUL headline (50-60 chars) with emotional hook or shocking insight",
                  "excerpt": "Compelling summary (150-160 chars) that promises exclusive value and creates FOMO",
                  "content": "FULL ARTICLE (1500-2000 words) in HTML format:
                    
                    ✓ Use <h2> for main sections, <h3> for subsections
                    ✓ <p> for paragraphs with proper spacing
                    ✓ <blockquote> for powerful quotes and key insights
                    ✓ <strong> for emphasis on critical points
                    ✓ Include 3-5 expert quotes with attribution
                    ✓ Add specific data, percentages, dollar figures
                    ✓ Create 5-7 well-structured sections
                    
                    REQUIRED SECTIONS:
                    1. EXPLOSIVE OPENING (2-3 paragraphs) - Hook with shocking angle
                    2. THE BREAKING STORY (3-4 paragraphs) - Core facts with dramatic framing
                    3. DEEPER ANALYSIS (4-5 paragraphs) - Expert insights and implications
                    4. MARKET IMPACT (3-4 paragraphs) - How this affects investors, consumers, economy
                    5. INSIDER PERSPECTIVES (3-4 paragraphs) - Multiple expert voices and debate
                    6. HISTORICAL CONTEXT (2-3 paragraphs) - Pattern analysis and precedents
                    7. WHAT'S NEXT (2-3 paragraphs) - Predictions and actionable takeaways",
                  "metaTitle": "SEO-optimized title (55-60 chars) with primary keyword and emotional trigger",
                  "metaDescription": "SEO description (150-160 chars) with value proposition, keyword, and call-to-action",
                  "metaKeywords": ["primary-keyword", "secondary-keyword", "trending-term", "industry-entity", "location-if-relevant"],
                  "tags": ["category", "topic", "trend", "entity"],
                  "imagePrompt": "Professional financial news photograph: [specific scene with precise details], dramatic lighting, high-impact composition, photojournalistic style, ultra high resolution, conveys urgency and importance"
                }
                
                🚨 CRITICAL: This is NOT a summary of the source. This is ORIGINAL investigative journalism that uses the source as a starting point but goes 10X deeper with exclusive analysis, expert interviews, market implications, and predictive insights.`
              },
              {
                role: 'user',
                content: `🔥 ASSIGNMENT: Transform this Yahoo Finance alert into a POWERFUL, VIRAL investigative story for Cardinal News.

SOURCE MATERIAL (Use as starting point ONLY):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADLINE: "${article.title}"
DESCRIPTION: ${article.description}
PUBLISHED: ${article.pubDate}
SOURCE URL: ${article.link}
${article.category && article.category.length > 0 ? `TOPICS: ${article.category.join(', ')}` : ''}

🎯 YOUR MISSION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Create a COMPLETELY UNIQUE article that goes 10X deeper than the source
✅ Find a SHOCKING angle or hidden implication the source missed
✅ Add EXTENSIVE original analysis and expert commentary
✅ Include multiple perspectives and conflicting viewpoints for debate
✅ Connect to broader economic trends and global implications
✅ Add historical context and pattern recognition
✅ Predict market impact and future developments
✅ Make it SHAREABLE with quotable insights and viral hooks
✅ Write 1500-2000 words of sophisticated, powerful journalism

🚨 CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DO NOT summarize or paraphrase the source
❌ DO NOT use their headline or angle
✅ DO find the story behind the story
✅ DO challenge assumptions with data
✅ DO include 3-5 expert quotes (can be hypothetical but realistic industry voices)
✅ DO add specific numbers, percentages, dollar figures
✅ DO create emotional resonance and human impact
✅ DO optimize for Google E-E-A-T and News featuring
✅ DO credit Yahoo Finance as source while delivering 100% original analysis

💥 POWER WRITING CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Explosive opening that grabs attention instantly
□ Controversial or surprising angle that sparks debate
□ At least 3 "wow factor" data points or revelations
□ Multiple expert voices with conflicting perspectives
□ Clear explanation of real-world impact on readers
□ Historical precedents and pattern analysis
□ Forward-looking predictions and actionable insights
□ Quotable moments perfect for social media sharing

Return ONLY valid JSON with no markdown formatting or additional text. Make this article LEGENDARY.`
              }
            ],
            temperature: 0.8,
            max_tokens: 6000,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          throw new Error(`AI generation failed: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        let generatedContent = aiData.choices[0].message.content;
        
        // Strip markdown code blocks if present
        generatedContent = generatedContent.trim();
        if (generatedContent.startsWith('```json')) {
          generatedContent = generatedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (generatedContent.startsWith('```')) {
          generatedContent = generatedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse the JSON response
        let articleData;
        try {
          articleData = JSON.parse(generatedContent.trim());
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', generatedContent);
          throw new Error('AI did not return valid JSON');
        }

        // ALWAYS prioritize real news images from web sources
        console.log('🔍 Searching for real news images from web sources...');
        let imageUrl = null;
        let imageCredit = null;

        try {
          const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
            body: { 
              topic: articleData.title,
              category: mapCategoryToCardinal(category)
            }
          });

          if (!imageError && imageData?.success) {
            imageUrl = imageData.imageUrl;
            imageCredit = imageData.imageCredit;
            console.log('✓ Real news image sourced:', imageCredit);
          } else {
            console.warn('⚠️ No suitable news image found - article will be saved without image to avoid AI-generated content');
            // DO NOT generate AI images - leave blank if no real image found
            imageUrl = null;
            imageCredit = null;
          }
        } catch (imageError) {
          console.error('Image fetch failed:', imageError);
          imageUrl = null;
          imageCredit = null;
        }

        // Calculate read time and word count
        const wordCount = articleData.content.split(/\s+/).length;
        const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

        // Prepare article data with AI-generated content
        const now = new Date().toISOString();
        const insertData = {
          title: articleData.title,
          slug: slug,
          excerpt: articleData.excerpt,
          content: articleData.content,
          category: mapCategoryToCardinal(category),
          author: 'Hunain Qureshi',
          tags: articleData.tags || article.category || ['finance', 'business'],
          meta_title: articleData.metaTitle,
          meta_description: articleData.metaDescription,
          meta_keywords: articleData.metaKeywords || ['finance', 'business', 'yahoo finance'],
          og_title: articleData.metaTitle,
          og_description: articleData.metaDescription,
          og_image: imageUrl,
          status: 'draft',
          published_at: null,
          sources: [
            {
              name: 'Yahoo Finance',
              url: article.link,
              date: article.pubDate
            }
          ],
          news_keywords: articleData.metaKeywords || article.category,
          read_time: readTime,
          word_count: wordCount,
          image_url: imageUrl,
          featured_image: imageUrl,
          image_credit: imageCredit,
        };

        // Insert article
        const { data: inserted, error } = await supabase
          .from('articles')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error(`Error inserting article: ${error.message}`);
          continue;
        }

        console.log(`✓ Article published successfully: ${inserted.id}`);
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
