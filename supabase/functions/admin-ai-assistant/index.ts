import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log('[AI Assistant] Received request with', messages.length, 'messages');
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Define AI tools
    const tools = [
      {
        type: "function",
        function: {
          name: "fetch_google_trends",
          description: "Fetch current Google Trends for a specific region. Returns trending search queries right now.",
          parameters: {
            type: "object",
            properties: {
              region: { 
                type: "string",
                description: "Region code (e.g., 'US', 'GB', 'world')",
                enum: ["US", "GB", "CA", "AU", "IN", "world"]
              }
            },
            required: ["region"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fetch_breaking_news",
          description: "Fetch current breaking news and worldwide trending stories from multiple sources.",
          parameters: {
            type: "object",
            properties: {
              query: { 
                type: "string",
                description: "Search query for news (e.g., 'breaking news', 'technology', 'sports')"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_database",
          description: "Query the database using Supabase client methods. Can select articles, trends, jobs, etc.",
          parameters: {
            type: "object",
            properties: {
              table: { type: "string", description: "Table name to query" },
              filters: { type: "object", description: "Filters to apply" },
              limit: { type: "number", description: "Maximum number of records to return" }
            },
            required: ["table"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_article",
          description: "Create a new article with the specified details",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              excerpt: { type: "string" },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              status: { type: "string", enum: ["draft", "published"] }
            },
            required: ["title", "content", "category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_article",
          description: "Update an existing article by ID",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" },
              updates: { type: "object", description: "Fields to update" }
            },
            required: ["id", "updates"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_article",
          description: "Delete an article by ID",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" }
            },
            required: ["id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_system_stats",
          description: "Get overall system statistics including article counts, job status, trending topics",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_security",
          description: "Run a security check on the database and return potential issues",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    // System prompt
    const systemPrompt = `You are an elite AI Assistant for Cardinal News admin dashboard with real-time data access.

**Core Capabilities:**
1. **Real-Time Intelligence**: Fetch live Google Trends and breaking news worldwide
2. **Database Mastery**: Query and analyze all platform data
3. **Content Management**: Create, edit, and delete articles instantly
4. **Security Guardian**: Monitor and alert on security issues
5. **Analytics Expert**: Provide deep insights on performance and trends

**Special Powers:**
- fetch_google_trends: Get current trending searches by region
- fetch_breaking_news: Get real-time breaking news and stories
- query_database: Access any data in the system
- create_article: Generate articles instantly
- update_article: Modify existing content
- delete_article: Remove articles
- get_system_stats: System-wide analytics
- check_security: Security audits

**Communication Style:**
- Direct and professional
- Proactive with insights
- Alert on critical issues immediately
- Explain actions before executing
- Provide actionable recommendations

You can answer ANY question about the platform, current trends, breaking news, or help with content creation. Be helpful, intelligent, and efficient.`;

    // First AI call to get tool usage
    console.log('[AI Assistant] Making initial AI call');
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("[AI Assistant] AI gateway error:", initialResponse.status, errorText);
      
      if (initialResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initialData = await initialResponse.json();
    console.log('[AI Assistant] Initial response received');
    
    const message = initialData.choices[0].message;
    
    // Check if tool calls are needed
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('[AI Assistant] Tool calls detected:', message.tool_calls.length);
      
      // Execute all tool calls
      const toolResults = [];
      for (const toolCall of message.tool_calls) {
        console.log('[AI Assistant] Executing tool:', toolCall.function.name);
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        
        let result;
        
        try {
          switch (functionName) {
            case "fetch_google_trends":
              console.log('[AI Assistant] Fetching Google Trends for:', args.region);
              if (SERPER_API_KEY) {
                const trendsResponse = await fetch(`https://serpapi.com/search?engine=google_trends&q=&geo=${args.region}&api_key=${SERPER_API_KEY}`);
                if (trendsResponse.ok) {
                  const trendsData = await trendsResponse.json();
                  result = {
                    success: true,
                    trends: trendsData.daily_searches?.slice(0, 10) || [],
                    region: args.region
                  };
                } else {
                  result = { error: "Failed to fetch trends" };
                }
              } else {
                // Fallback to database trends
                const { data: dbTrends } = await supabase
                  .from('trending_topics')
                  .select('*')
                  .order('trend_strength', { ascending: false })
                  .limit(10);
                result = {
                  success: true,
                  trends: dbTrends || [],
                  source: "database"
                };
              }
              break;
              
            case "fetch_breaking_news":
              console.log('[AI Assistant] Fetching breaking news for:', args.query);
              if (SERPER_API_KEY) {
                const newsResponse = await fetch(`https://serpapi.com/search?engine=google_news&q=${encodeURIComponent(args.query)}&api_key=${SERPER_API_KEY}`);
                if (newsResponse.ok) {
                  const newsData = await newsResponse.json();
                  result = {
                    success: true,
                    news: newsData.news_results?.slice(0, 10) || [],
                    query: args.query
                  };
                } else {
                  result = { error: "Failed to fetch news" };
                }
              } else {
                result = { error: "News API not configured" };
              }
              break;
              
            case "query_database":
              console.log('[AI Assistant] Querying database table:', args.table);
              let query = supabase.from(args.table).select('*');
              
              if (args.filters) {
                for (const [key, value] of Object.entries(args.filters)) {
                  query = query.eq(key, value);
                }
              }
              
              if (args.limit) {
                query = query.limit(args.limit);
              }
              
              const { data, error } = await query;
              result = error ? { error: error.message } : { data };
              break;
              
            case "create_article":
              console.log('[AI Assistant] Creating article:', args.title);
              const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 6);
              const { data: newArticle, error: createError } = await supabase
                .from('articles')
                .insert({
                  title: args.title,
                  content: args.content,
                  excerpt: args.excerpt || args.content.substring(0, 200),
                  category: args.category,
                  tags: args.tags || [],
                  slug: slug,
                  status: args.status || 'draft',
                  author: 'AI Assistant'
                })
                .select()
                .single();
              result = createError ? { error: createError.message } : { success: true, article: newArticle };
              break;
              
            case "update_article":
              console.log('[AI Assistant] Updating article:', args.id);
              const { data: updatedArticle, error: updateError } = await supabase
                .from('articles')
                .update(args.updates)
                .eq('id', args.id)
                .select()
                .single();
              result = updateError ? { error: updateError.message } : { success: true, article: updatedArticle };
              break;
              
            case "delete_article":
              console.log('[AI Assistant] Deleting article:', args.id);
              const { error: deleteError } = await supabase
                .from('articles')
                .delete()
                .eq('id', args.id);
              result = deleteError ? { error: deleteError.message } : { success: true, message: "Article deleted" };
              break;
              
            case "get_system_stats":
              console.log('[AI Assistant] Fetching system stats');
              const [articles, jobs, trends] = await Promise.all([
                supabase.from('articles').select('status', { count: 'exact', head: true }),
                supabase.from('jobs').select('status', { count: 'exact', head: true }),
                supabase.from('trending_topics').select('processed', { count: 'exact', head: true })
              ]);
              
              const { count: publishedCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published');
              
              const { count: pendingJobs } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
              
              result = {
                articles: {
                  total: articles.count || 0,
                  published: publishedCount || 0,
                  draft: (articles.count || 0) - (publishedCount || 0)
                },
                jobs: {
                  total: jobs.count || 0,
                  pending: pendingJobs || 0
                },
                trends: {
                  total: trends.count || 0
                }
              };
              break;
              
            case "check_security":
              console.log('[AI Assistant] Running security check');
              const securityChecks = [];
              
              const { data: oldDrafts } = await supabase
                .from('articles')
                .select('id, title, created_at')
                .eq('status', 'draft')
                .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .limit(5);
              
              if (oldDrafts && oldDrafts.length > 0) {
                securityChecks.push({
                  type: "warning",
                  message: `Found ${oldDrafts.length} draft articles older than 30 days`,
                  items: oldDrafts
                });
              }
              
              result = { 
                checks: securityChecks,
                summary: securityChecks.length === 0 ? "No security issues detected" : `Found ${securityChecks.length} potential issues`
              };
              break;
              
            default:
              result = { error: "Unknown function: " + functionName };
          }
        } catch (err) {
          console.error('[AI Assistant] Tool execution error:', err);
          result = { error: err instanceof Error ? err.message : String(err) };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }
      
      // Make second AI call with tool results
      console.log('[AI Assistant] Making second AI call with tool results');
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            message,
            ...toolResults
          ],
          stream: true,
        }),
      });

      if (!finalResponse.ok) {
        throw new Error("Failed to get final response");
      }

      // Stream the final response
      return new Response(finalResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // No tools needed, stream the response directly
      console.log('[AI Assistant] No tools needed, streaming response');
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      });

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
  } catch (err) {
    console.error("[AI Assistant] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
