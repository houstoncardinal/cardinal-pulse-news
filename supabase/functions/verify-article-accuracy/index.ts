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

    // ENHANCED: Multi-stage AI-powered fact-checking with cross-validation
    const verificationPrompt = `You are Hector, Cardinal News's ADVANCED AI fact-checker, legal compliance officer, and journalistic integrity guardian. Perform COMPREHENSIVE multi-dimensional analysis.

ARTICLE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TITLE: "${article.title}"
CATEGORY: ${article.category}
AUTHOR: ${article.author}
WORD COUNT: ${article.content?.split(/\s+/).length || 0}
SOURCES: ${JSON.stringify(article.sources || [])}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FULL CONTENT:
${article.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORM EXHAUSTIVE 12-STAGE VERIFICATION:

1. FACT-CHECK ACCURACY (0-100):
   - Cross-reference ALL statistics with known data
   - Verify dates, numbers, percentages
   - Check historical accuracy
   - Validate technical/scientific claims
   - Assess logical consistency and causation
   - Identify contradictions or inconsistencies

2. SOURCE CREDIBILITY AUDIT:
   - Rate each source (0-100): reputation, bias, reliability
   - Check for primary vs secondary sources
   - Verify source citations are specific and relevant
   - Flag missing sources for major claims
   - Assess source diversity (avoid single-source dependency)
   - Check for circular reporting

3. LEGAL RISK MATRIX:
   - Defamation/libel exposure (public figures vs private individuals)
   - Privacy violations (PII, medical info, financial data)
   - Copyright/trademark infringement
   - False advertising/misleading claims
   - Securities law compliance (if financial content)
   - Regulatory compliance (FTC, FDA, etc.)
   - Right to publicity violations

4. MISINFORMATION & PROPAGANDA DETECTION:
   - Identify unverified/unverifiable claims
   - Detect selective omission of context
   - Flag emotional manipulation techniques
   - Assess for partisan framing or bias
   - Check for conspiracy theories or pseudoscience
   - Identify clickbait or sensationalism

5. JOURNALISTIC ETHICS CHECK:
   - Verify proper attribution and quotes
   - Check for conflicts of interest
   - Assess balanced reporting
   - Verify correction policy compliance
   - Check for plagiarism indicators

6. SENTIMENT & TONE ANALYSIS:
   - Assess objectivity vs opinion
   - Check for inflammatory language
   - Evaluate fairness to all parties
   - Detect potential bias indicators

7. CONTEXTUAL COMPLETENESS:
   - Check for missing background/context
   - Verify all sides of controversial issues presented
   - Assess if article provides full picture

8. TECHNICAL ACCURACY:
   - Verify specialized terminology usage
   - Check industry-specific claims
   - Validate scientific/technical data

9. TEMPORAL RELEVANCE:
   - Confirm information is current
   - Flag outdated statistics or references
   - Check for breaking news updates needed

10. CREDIBILITY SIGNALS:
    - Expert quotes properly attributed
    - Data visualization accuracy
    - Transparent methodology
    - Clear disclaimers where needed

11. AUDIENCE SAFETY:
    - Check for harmful advice
    - Verify medical/health claims
    - Assess financial advice safety
    - Flag potentially dangerous content

12. CROSS-REFERENCE VALIDATION:
    - Compare with other reputable sources
    - Verify consensus on controversial topics
    - Check for outlier claims

RESPOND IN JSON (BE THOROUGH & SPECIFIC):
{
  "accuracy_score": 0-100,
  "verification_status": "verified" | "flagged" | "needs_review" | "rejected",
  "confidence_level": 0-100,
  "fact_check_results": [
    {
      "claim": "exact claim from article",
      "verdict": "true" | "false" | "unverified" | "misleading" | "partially_true",
      "explanation": "detailed reasoning with evidence",
      "confidence": 0-100,
      "severity": "critical" | "high" | "medium" | "low"
    }
  ],
  "source_credibility": {
    "overall_rating": 0-100,
    "sources_evaluated": [
      {
        "name": "source name",
        "credibility_score": 0-100,
        "bias_assessment": "left|center|right|unknown",
        "reliability": "high|medium|low"
      }
    ],
    "missing_sources": ["topics requiring additional citation"],
    "red_flags": ["specific credibility concerns"],
    "recommendation": "add more diverse sources" | "acceptable" | "needs major sourcing overhaul"
  },
  "legal_risk_assessment": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "legal_concerns": [
    {
      "type": "defamation|privacy|copyright|etc",
      "severity": "critical|high|medium|low",
      "description": "detailed explanation",
      "recommendation": "specific action needed"
    }
  ],
  "journalistic_integrity_score": 0-100,
  "misinformation_detected": true/false,
  "misinformation_details": ["specific instances of misinformation"],
  "bias_analysis": {
    "bias_detected": true/false,
    "bias_type": "political|commercial|ideological|none",
    "bias_severity": "high|medium|low|none"
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "action": "specific actionable step",
      "rationale": "why this is needed"
    }
  ],
  "compliance_status": "APPROVED" | "NEEDS_REVISION" | "REJECTED",
  "rejection_reasons": ["specific reasons if rejected"],
  "strengths": ["what the article does well"],
  "weaknesses": ["areas for improvement"]
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
          { role: 'system', content: 'You are Hector, Cardinal News\'s ADVANCED AI fact-checker and legal compliance officer with expertise in journalism ethics, law, and data verification. You have access to extensive knowledge across multiple domains. ALWAYS respond with valid JSON only. Be thorough, precise, and uncompromising in your analysis.' },
          { role: 'user', content: verificationPrompt }
        ],
        temperature: 0.2, // Lower for maximum accuracy
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
