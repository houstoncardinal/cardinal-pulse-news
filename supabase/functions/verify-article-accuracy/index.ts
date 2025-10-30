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
    const { articleId } = await req.json();
    
    console.log(`🤖 Hector analyzing article: ${articleId}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch article
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      throw new Error('Article not found');
    }

    console.log(`📰 Analyzing: "${article.title}"`);

    // AI-powered fact-checking
    const verificationPrompt = `You are Hector, Cardinal News's AI fact-checker and legal compliance officer. Analyze this article for accuracy, credibility, and legal risks.

ARTICLE TITLE: "${article.title}"
CATEGORY: ${article.category}
CONTENT (first 2000 chars): "${article.content?.substring(0, 2000)}"
AUTHOR: ${article.author}
SOURCES: ${JSON.stringify(article.sources || [])}

COMPREHENSIVE ANALYSIS REQUIRED:

1. FACT-CHECK ACCURACY (Rate 0-100):
   - Verify key claims and statistics
   - Check for factual errors or misrepresentations
   - Assess logical consistency

2. SOURCE CREDIBILITY:
   - Evaluate source reliability and reputation
   - Check for proper attribution
   - Identify missing sources for major claims

3. LEGAL RISK ASSESSMENT:
   - Defamation risks (libel/slander)
   - Copyright violations
   - Privacy concerns
   - Misleading/false advertising claims
   - Regulatory compliance issues

4. MISINFORMATION DETECTION:
   - Identify unverified claims
   - Flag sensationalism or clickbait
   - Detect bias or partisan framing

5. RECOMMENDATIONS:
   - Specific improvements needed
   - Additional sources to cite
   - Legal disclaimers to add
   - Content corrections required

Respond in JSON format ONLY:
{
  "accuracy_score": 0-100,
  "verification_status": "verified" | "flagged" | "needs_review" | "rejected",
  "fact_check_results": [
    {
      "claim": "specific claim from article",
      "verdict": "true" | "false" | "unverified" | "misleading",
      "explanation": "detailed reasoning",
      "confidence": 0-100
    }
  ],
  "source_credibility": {
    "overall_rating": 0-100,
    "sources_evaluated": ["source names"],
    "missing_sources": ["topics needing citations"],
    "red_flags": ["credibility concerns"]
  },
  "legal_risk_assessment": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "legal_concerns": ["specific legal issues"],
  "misinformation_detected": true/false,
  "recommendations": ["specific actionable steps"],
  "compliance_status": "APPROVED" | "NEEDS_REVISION" | "REJECTED"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are Hector, a meticulous AI fact-checker and legal compliance officer. Always respond with valid JSON only.' },
          { role: 'user', content: verificationPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI verification failed');
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0].message.content;
    
    console.log('🤖 Hector analysis complete');

    // Parse AI response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const verification = JSON.parse(jsonMatch[0]);

    // Store verification results
    const { data: verificationRecord, error: verificationError } = await supabaseClient
      .from('article_verifications')
      .insert({
        article_id: articleId,
        accuracy_score: verification.accuracy_score,
        verification_status: verification.verification_status,
        fact_check_results: verification.fact_check_results,
        source_credibility: verification.source_credibility,
        legal_risk_assessment: verification.legal_risk_assessment,
        recommendations: verification.recommendations,
      })
      .select()
      .single();

    if (verificationError) {
      console.error('Failed to store verification:', verificationError);
      throw verificationError;
    }

    console.log(`✅ Verification stored: ${verification.verification_status} (${verification.accuracy_score}/100)`);

    return new Response(
      JSON.stringify({
        success: true,
        verification: verificationRecord,
        compliance_status: verification.compliance_status,
        legal_concerns: verification.legal_concerns,
        misinformation_detected: verification.misinformation_detected
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-article-accuracy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
