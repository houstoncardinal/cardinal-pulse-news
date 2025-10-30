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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Define AI tools for database and platform operations
    const tools = [
      {
        type: "function",
        function: {
          name: "query_database",
          description: "Execute a SELECT query on the database to retrieve information. Use this to check articles, trends, jobs, settings, etc.",
          parameters: {
            type: "object",
            properties: {
              query: { 
                type: "string",
                description: "SQL SELECT query to execute. Only SELECT queries are allowed."
              }
            },
            required: ["query"]
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
              title: { type: "string" },
              content: { type: "string" },
              excerpt: { type: "string" },
              status: { type: "string", enum: ["draft", "published"] },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["id"]
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
          name: "check_security",
          description: "Run a security check on the database and return potential issues",
          parameters: {
            type: "object",
            properties: {}
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
      }
    ];

    // System prompt for the AI assistant
    const systemPrompt = `You are a powerful AI Assistant for Cardinal News admin dashboard. You have full access to the platform and can:

1. **Navigate & Explain**: Help admins understand any part of the platform
2. **Database Operations**: Query and analyze all data in real-time
3. **Article Management**: Create, edit, update, and delete articles
4. **Security Monitoring**: Check for security issues and alert admins
5. **System Analytics**: Provide insights on performance, trends, and operations
6. **Error Detection**: Identify and help resolve issues

**Important Guidelines:**
- Always be proactive and helpful
- When querying the database, use proper SQL syntax
- Before making changes, explain what you're about to do
- Alert users immediately if you detect security concerns
- Provide actionable insights and suggestions
- Be concise but thorough

**Available Tools:**
- query_database: Execute SELECT queries to retrieve data
- create_article: Create new articles
- update_article: Modify existing articles
- delete_article: Remove articles
- check_security: Run security analysis
- get_system_stats: Get platform statistics

You are currently helping an admin manage their news platform. Be professional, efficient, and security-conscious.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle streaming response with tool calls
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) return;
        
        let buffer = "";
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;
              
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                
                // Check for tool calls
                if (parsed.choices?.[0]?.delta?.tool_calls) {
                  const toolCall = parsed.choices[0].delta.tool_calls[0];
                  
                  if (toolCall?.function?.name) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    
                    // Execute tool
                    let result;
                    switch (functionName) {
                      case "query_database":
                        try {
                          const { data, error } = await supabase.rpc('exec_sql', { sql: args.query });
                          result = error ? { error: error.message } : { data };
                        } catch (err) {
                          result = { error: err instanceof Error ? err.message : String(err) };
                        }
                        break;
                        
                      case "create_article":
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
                        result = createError ? { error: createError.message } : { data: newArticle };
                        break;
                        
                      case "update_article":
                        const updateData: any = {};
                        if (args.title) updateData.title = args.title;
                        if (args.content) updateData.content = args.content;
                        if (args.excerpt) updateData.excerpt = args.excerpt;
                        if (args.status) updateData.status = args.status;
                        if (args.tags) updateData.tags = args.tags;
                        
                        const { data: updatedArticle, error: updateError } = await supabase
                          .from('articles')
                          .update(updateData)
                          .eq('id', args.id)
                          .select()
                          .single();
                        result = updateError ? { error: updateError.message } : { data: updatedArticle };
                        break;
                        
                      case "delete_article":
                        const { error: deleteError } = await supabase
                          .from('articles')
                          .delete()
                          .eq('id', args.id);
                        result = deleteError ? { error: deleteError.message } : { success: true };
                        break;
                        
                      case "check_security":
                        // Check for common security issues
                        const securityChecks = [];
                        
                        // Check for articles without proper status
                        const { count: draftCount } = await supabase
                          .from('articles')
                          .select('*', { count: 'exact', head: true })
                          .eq('status', 'draft');
                        
                        // Check for old unpublished articles
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
                        
                      case "get_system_stats":
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
                        
                      default:
                        result = { error: "Unknown function" };
                    }
                    
                    // Send tool result back to stream
                    const toolResult = {
                      type: "tool_result",
                      tool_call_id: toolCall.id,
                      result: JSON.stringify(result)
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolResult)}\n\n`));
                  }
                }
                
                // Forward the original message
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (e) {
                console.error("Error parsing SSE:", e);
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
