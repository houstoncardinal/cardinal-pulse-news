import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, type = 'quote' } = await req.json();
    const apiKey = Deno.env.get('FINNHUB_API_KEY');

    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    console.log(`[Finnhub] Fetching ${type} data for symbols:`, symbols);

    // Handle different request types
    if (type === 'quote') {
      // Fetch real-time quotes for multiple symbols
      const quotes = await Promise.all(
        symbols.map(async (symbol: string) => {
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
          );
          const data = await response.json();
          return {
            symbol,
            price: data.c, // current price
            change: data.d, // change
            changePercent: data.dp, // percent change
            high: data.h, // high price of the day
            low: data.l, // low price of the day
            open: data.o, // open price of the day
            previousClose: data.pc, // previous close price
            timestamp: data.t
          };
        })
      );

      return new Response(JSON.stringify({ quotes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (type === 'profile') {
      // Fetch company profile
      const symbol = symbols[0];
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
      );
      const profile = await response.json();

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (type === 'candles') {
      // Fetch historical data for charts
      const { symbol, resolution = 'D', from, to } = await req.json();
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
      );
      const candles = await response.json();

      return new Response(JSON.stringify({ candles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (type === 'news') {
      // Fetch company news
      const symbol = symbols[0];
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`
      );
      const news = await response.json();

      return new Response(JSON.stringify({ news }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (type === 'search') {
      // Search for stocks
      const query = symbols[0];
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`
      );
      const results = await response.json();

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid request type');
  } catch (error) {
    console.error('[Finnhub] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
