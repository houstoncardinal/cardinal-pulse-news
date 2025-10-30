import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleTitle, imageCredit, imageUrl, articleContent } = await req.json();
    
    console.log(`🔍 Validating image for article: ${articleTitle}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract brand names and key entities from article
    const titleLower = articleTitle.toLowerCase();
    const contentLower = (articleContent || '').toLowerCase().substring(0, 1000);
    const creditLower = (imageCredit || '').toLowerCase();
    const urlLower = (imageUrl || '').toLowerCase();

    // Common brand confusion pairs that MUST be prevented
    const brandConfusions = [
      { brands: ['mcdonalds', "mcdonald's", 'mcd'], conflicts: ['chipotle', 'chipotles', 'cmg'] },
      { brands: ['chipotle', 'chipotles', 'cmg'], conflicts: ['mcdonalds', "mcdonald's", 'mcd', 'burger king', 'wendys', 'taco bell'] },
      { brands: ['burger king', 'bk'], conflicts: ['mcdonalds', 'wendys', "wendy's"] },
      { brands: ['coca cola', 'coke', 'cocacola'], conflicts: ['pepsi', 'pepsico'] },
      { brands: ['pepsi', 'pepsico'], conflicts: ['coca cola', 'coke', 'cocacola'] },
      { brands: ['nike'], conflicts: ['adidas', 'reebok', 'under armour'] },
      { brands: ['adidas'], conflicts: ['nike', 'reebok', 'puma'] },
      { brands: ['apple', 'aapl'], conflicts: ['samsung', 'google', 'microsoft'] },
      { brands: ['samsung'], conflicts: ['apple', 'lg', 'sony'] },
      { brands: ['google', 'googl'], conflicts: ['apple', 'microsoft', 'amazon'] },
      { brands: ['amazon', 'amzn'], conflicts: ['walmart', 'target', 'alibaba'] },
      { brands: ['tesla', 'tsla'], conflicts: ['ford', 'gm', 'toyota', 'rivian'] },
      { brands: ['starbucks', 'sbux'], conflicts: ['dunkin', 'costa coffee', 'peets'] },
    ];

    // Check for brand conflicts
    for (const confusion of brandConfusions) {
      const articleHasBrand = confusion.brands.some(brand => 
        titleLower.includes(brand) || contentLower.includes(brand)
      );
      
      const imageHasConflict = confusion.conflicts.some(conflict => 
        creditLower.includes(conflict) || urlLower.includes(conflict)
      );

      if (articleHasBrand && imageHasConflict) {
        console.error(`❌ BRAND MISMATCH DETECTED: Article about ${confusion.brands[0]} has image from ${confusion.conflicts.find(c => creditLower.includes(c) || urlLower.includes(c))}`);
        return new Response(
          JSON.stringify({
            valid: false,
            reason: 'brand_mismatch',
            message: `Image is from wrong brand. Article is about ${confusion.brands[0]}, but image appears to be from a competitor.`,
            suggested_action: 'generate_new_image'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use AI to validate image relevance
    const validationPrompt = `You are a strict image validation system for a news website.

Article Title: "${articleTitle}"
Article Content (first 500 chars): "${articleContent?.substring(0, 500) || 'N/A'}"
Image Credit: "${imageCredit || 'Unknown'}"
Image URL: "${imageUrl || 'N/A'}"

Task: Determine if this image is appropriate and relevant for this article.

CRITICAL CHECKS:
1. Brand Accuracy: If the article is about a specific company (e.g., Chipotle, Apple, Tesla), the image MUST be from that exact company. Images from competitors are NEVER acceptable.
2. Topic Relevance: The image must be directly related to the main topic of the article.
3. No Generic Stock Photos: Reject generic "business concept" or "office" images for specific company articles.
4. Visual Coherence: The image should enhance understanding of the article, not confuse readers.

Respond in JSON format ONLY:
{
  "valid": true/false,
  "confidence": 0-100,
  "reason": "brief explanation",
  "brands_detected": ["list of brands mentioned in article"],
  "image_brand": "brand shown in image if identifiable",
  "recommendation": "keep" or "replace"
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
          { role: 'system', content: 'You are an image validation expert. Always respond with valid JSON only.' },
          { role: 'user', content: validationPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI validation failed:', aiResponse.status);
      // Default to cautious validation
      return new Response(
        JSON.stringify({
          valid: true,
          confidence: 50,
          reason: 'AI validation unavailable, proceeding with caution',
          warning: 'Manual review recommended'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0].message.content;
    
    console.log('AI Validation Response:', aiContent);

    // Parse AI response
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);
        
        console.log(`✓ Image validation complete: ${validation.valid ? 'VALID' : 'INVALID'} (confidence: ${validation.confidence}%)`);
        
        return new Response(
          JSON.stringify({
            ...validation,
            article_title: articleTitle,
            image_credit: imageCredit
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('Failed to parse AI validation response:', parseError);
    }

    // Fallback: if we can't parse AI response, use basic validation
    return new Response(
      JSON.stringify({
        valid: true,
        confidence: 60,
        reason: 'Basic validation passed, AI parsing failed',
        warning: 'Manual review recommended'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-article-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        valid: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
