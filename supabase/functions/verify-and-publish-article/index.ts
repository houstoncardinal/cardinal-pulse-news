import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * INDUSTRY-STANDARD ARTICLE VERIFICATION & PUBLISHING PIPELINE
 * 
 * Multi-stage verification system:
 * 1. Real-time news validation
 * 2. AI fact-checking with Hector
 * 3. Source verification
 * 4. Accuracy scoring (0-100)
 * 5. Legal risk assessment
 * 6. Automated publishing or human review queue
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, skipVerification = false } = await req.json();
    
    console.log(`🔍 Starting verification pipeline for article: ${articleId}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    
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

    console.log(`📰 Article: "${article.title}"`);

    // STAGE 1: Real-time news validation
    console.log('📡 Stage 1: Real-time news validation...');
    let newsValidation = { exists: false, sources: [], confidence: 0 };
    
    if (SERPER_API_KEY) {
      try {
        const searchQuery = article.title.split(':')[0].trim();
        const newsResponse = await fetch(
          `https://serpapi.com/search?engine=google_news&q=${encodeURIComponent(searchQuery)}&api_key=${SERPER_API_KEY}`
        );
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const newsResults = newsData.news_results || [];
          
          if (newsResults.length > 0) {
            newsValidation = {
              exists: true,
              sources: newsResults.slice(0, 3).map((n: any) => ({
                title: n.title,
                source: n.source,
                link: n.link,
                date: n.date
              })),
              confidence: Math.min(100, newsResults.length * 20)
            };
            console.log(`✓ Found ${newsResults.length} related news articles`);
          } else {
            console.log('⚠️ No real-time news found - article may be fabricated');
            newsValidation.confidence = 0;
          }
        }
      } catch (newsError) {
        console.error('News validation failed:', newsError);
      }
    }

    // STAGE 2: AI Fact-Checking with Hector
    console.log('🤖 Stage 2: AI fact-checking...');
    const factCheckPrompt = `You are Hector, an elite fact-checker for Cardinal News. Analyze this article for accuracy, credibility, and potential misinformation.

ARTICLE TITLE: "${article.title}"
CATEGORY: ${article.category}
CONTENT: "${article.content?.substring(0, 3000)}"
SOURCES: ${JSON.stringify(article.sources || [])}
REAL NEWS VALIDATION: ${JSON.stringify(newsValidation)}

COMPREHENSIVE FACT-CHECK:

1. FACTUAL ACCURACY (0-100):
   - Verify key claims against real-world data
   - Check for fabricated information
   - Assess logical consistency
   - Cross-reference with real news sources

2. SOURCE CREDIBILITY:
   - Are sources real and verifiable?
   - Are sources properly cited?
   - Do sources support the claims?

3. MISINFORMATION DETECTION:
   - Identify unverified claims
   - Flag potential fabrications
   - Detect bias or sensationalism
   - Check for outdated information

4. REAL-WORLD VALIDATION:
   - Does this event/story actually exist?
   - Is the information current and accurate?
   - Are there real news sources covering this?

5. RECOMMENDATIONS:
   - Should this be published? (yes/no/needs_review)
   - What corrections are needed?
   - What additional sources should be cited?

Respond in JSON format ONLY:
{
  "accuracy_score": 0-100,
  "verification_status": "verified" | "flagged" | "needs_review" | "rejected",
  "is_fabricated": true/false,
  "fact_check_results": [
    {
      "claim": "specific claim",
      "verdict": "true" | "false" | "unverified" | "misleading",
      "explanation": "detailed reasoning",
      "confidence": 0-100
    }
  ],
  "source_credibility": {
    "overall_rating": 0-100,
    "real_sources": ["verified source names"],
    "fake_sources": ["fabricated sources"],
    "missing_citations": ["claims needing sources"]
  },
  "real_world_validation": {
    "event_exists": true/false,
    "supporting_evidence": ["evidence description"],
    "contradicting_evidence": ["contradictions found"]
  },
  "legal_risk_assessment": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendations": ["specific actionable steps"],
  "publish_recommendation": "publish" | "needs_revision" | "reject",
  "required_corrections": ["specific corrections needed"]
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
          { 
            role: 'system', 
            content: 'You are Hector, an elite fact-checker. Be extremely strict. Flag any fabricated or unverifiable content. Always respond with valid JSON only.' 
          },
          { role: 'user', content: factCheckPrompt }
        ],
        temperature: 0.2, // Lower temperature for factual accuracy
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI fact-checking failed');
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

    // STAGE 3: Combined Decision Logic
    console.log('⚖️ Stage 3: Making publish decision...');
    
    const finalScore = verification.accuracy_score;
    const isFabricated = verification.is_fabricated || false;
    const realNewsConfidence = newsValidation.confidence;
    const legalRisk = verification.legal_risk_assessment;

    let finalDecision = 'reject';
    let finalStatus = 'draft';
    let reasonsForDecision: string[] = [];

    // Industry-standard decision matrix
    if (isFabricated) {
      finalDecision = 'reject';
      reasonsForDecision.push('Article contains fabricated information');
    } else if (legalRisk === 'HIGH' || legalRisk === 'CRITICAL') {
      finalDecision = 'needs_review';
      finalStatus = 'draft';
      reasonsForDecision.push(`High legal risk: ${legalRisk}`);
    } else if (finalScore >= 85 && realNewsConfidence >= 40) {
      finalDecision = 'publish';
      finalStatus = 'published';
      reasonsForDecision.push('High accuracy score and verified by real news sources');
    } else if (finalScore >= 70 && realNewsConfidence >= 20) {
      finalDecision = 'needs_review';
      finalStatus = 'draft';
      reasonsForDecision.push('Moderate accuracy - requires human review');
    } else if (finalScore < 70 || realNewsConfidence < 20) {
      finalDecision = 'reject';
      reasonsForDecision.push('Low accuracy score or insufficient real-world validation');
    } else {
      finalDecision = 'needs_review';
      finalStatus = 'draft';
      reasonsForDecision.push('Borderline case - requires human review');
    }

    console.log(`📊 Final Decision: ${finalDecision}`);
    console.log(`📊 Final Score: ${finalScore}/100`);
    console.log(`📊 Real News Confidence: ${realNewsConfidence}%`);
    console.log(`📊 Reasons: ${reasonsForDecision.join(', ')}`);

    // Store verification results
    const { data: verificationRecord, error: verificationError } = await supabaseClient
      .from('article_verifications')
      .insert({
        article_id: articleId,
        accuracy_score: finalScore,
        verification_status: verification.verification_status,
        fact_check_results: verification.fact_check_results,
        source_credibility: verification.source_credibility,
        legal_risk_assessment: legalRisk,
        recommendations: verification.recommendations,
      })
      .select()
      .single();

    if (verificationError) {
      console.error('Failed to store verification:', verificationError);
    }

    // Update article status based on decision
    const updateData: any = {
      verification_score: finalScore,
      verification_status: verification.verification_status,
      status: finalStatus
    };

    if (finalDecision === 'publish') {
      updateData.published_at = new Date().toISOString();
      updateData.status = 'published';
    } else if (finalDecision === 'reject') {
      updateData.status = 'draft';
      updateData.rejection_reason = reasonsForDecision.join('; ');
    }

    const { error: updateError } = await supabaseClient
      .from('articles')
      .update(updateData)
      .eq('id', articleId);

    if (updateError) {
      console.error('Failed to update article:', updateError);
    }

    const responseData = {
      success: true,
      decision: finalDecision,
      verification: {
        score: finalScore,
        status: verification.verification_status,
        is_fabricated: isFabricated,
        legal_risk: legalRisk,
        real_news_confidence: realNewsConfidence,
        reasons: reasonsForDecision
      },
      article_status: finalStatus,
      verification_record: verificationRecord
    };

    if (finalDecision === 'reject') {
      console.log(`❌ Article REJECTED: ${article.title}`);
      console.log(`Reasons: ${reasonsForDecision.join(', ')}`);
    } else if (finalDecision === 'publish') {
      console.log(`✅ Article PUBLISHED: ${article.title}`);
    } else {
      console.log(`⚠️ Article NEEDS REVIEW: ${article.title}`);
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-and-publish-article:', error);
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
