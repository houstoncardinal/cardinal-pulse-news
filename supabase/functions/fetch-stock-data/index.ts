import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple API configurations for redundancy
const API_CONFIGS = {
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: Deno.env.get('ALPHA_VANTAGE_API_KEY') || 'demo',
    functions: {
      quote: 'GLOBAL_QUOTE',
      daily: 'TIME_SERIES_DAILY',
      intraday: 'TIME_SERIES_INTRADAY',
      search: 'SYMBOL_SEARCH'
    }
  },
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    apiKey: Deno.env.get('FINNHUB_API_KEY'),
    functions: {
      quote: '/quote',
      profile: '/stock/profile2',
      candles: '/stock/candle',
      news: '/company-news',
      search: '/search'
    }
  },
  twelveData: {
    baseUrl: 'https://api.twelvedata.com',
    apiKey: Deno.env.get('TWELVE_DATA_API_KEY'),
    functions: {
      quote: '/quote',
      timeSeries: '/time_series',
      symbolSearch: '/symbol_search'
    }
  }
};

// Generate realistic mock data
const generateMockQuote = (symbol: string) => {
  const basePrices: { [key: string]: number } = {
    'AAPL': 180, 'GOOGL': 140, 'MSFT': 380, 'AMZN': 155, 'TSLA': 250,
    'META': 350, 'NVDA': 850, 'AMD': 120, 'NFLX': 450, 'DIS': 95,
    'JPM': 180, 'V': 280, 'WMT': 160, 'BA': 220, 'INTC': 45
  };

  const basePrice = basePrices[symbol] || 100;
  const volatility = basePrice * 0.02; // 2% daily volatility
  const change = (Math.random() - 0.5) * volatility * 2;
  const price = basePrice + change;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: Math.round((price + Math.random() * volatility) * 100) / 100,
    low: Math.round((price - Math.random() * volatility) * 100) / 100,
    open: Math.round((price - change * 0.3) * 100) / 100,
    previousClose: Math.round((price - change) * 100) / 100,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    timestamp: Date.now()
  };
};

const generateMockCandles = (symbol: string, days: number = 365) => {
  const candles = [];
  let currentPrice = 150;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const timeString = date.toISOString().split('T')[0];

    const volatility = currentPrice * 0.03; // 3% daily volatility
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;

    const high = currentPrice + Math.abs(change) * 0.5;
    const low = currentPrice - Math.abs(change) * 0.5;
    const open = currentPrice - change * 0.7;
    const close = currentPrice;
    const volume = Math.floor(Math.random() * 50000000) + 1000000;

    candles.push({
      time: timeString,
      open: Math.max(0.01, Math.round(open * 100) / 100),
      high: Math.max(0.01, Math.round(high * 100) / 100),
      low: Math.max(0.01, Math.round(low * 100) / 100),
      close: Math.max(0.01, Math.round(close * 100) / 100),
      volume
    });
  }

  return {
    s: 'ok',
    t: candles.map(c => new Date(c.time).getTime() / 1000),
    o: candles.map(c => c.open),
    h: candles.map(c => c.high),
    l: candles.map(c => c.low),
    c: candles.map(c => c.close),
    v: candles.map(c => c.volume)
  };
};

// Alpha Vantage API functions
const fetchAlphaVantageQuote = async (symbol: string) => {
  const config = API_CONFIGS.alphaVantage;
  const url = `${config.baseUrl}?function=${config.functions.quote}&symbol=${symbol}&apikey=${config.apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data['Global Quote']) {
    const quote = data['Global Quote'];
    return {
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume']),
      timestamp: Date.now()
    };
  }
  return null;
};

const fetchAlphaVantageCandles = async (symbol: string, outputsize: string = 'compact') => {
  const config = API_CONFIGS.alphaVantage;
  const url = `${config.baseUrl}?function=${config.functions.daily}&symbol=${symbol}&outputsize=${outputsize}&apikey=${config.apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data['Time Series (Daily)']) {
    const timeSeries = data['Time Series (Daily)'];
    const timestamps = Object.keys(timeSeries).sort();
    const candles = timestamps.map(time => timeSeries[time]);

    return {
      s: 'ok',
      t: timestamps.map(t => new Date(t).getTime() / 1000),
      o: candles.map(c => parseFloat(c['1. open'])),
      h: candles.map(c => parseFloat(c['2. high'])),
      l: candles.map(c => parseFloat(c['3. low'])),
      c: candles.map(c => parseFloat(c['4. close'])),
      v: candles.map(c => parseInt(c['5. volume']))
    };
  }
  return null;
};

// Twelve Data API functions
const fetchTwelveDataQuote = async (symbol: string) => {
  const config = API_CONFIGS.twelveData;
  const url = `${config.baseUrl}${config.functions.quote}?symbol=${symbol}&apikey=${config.apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data && !data.message) {
    return {
      symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      open: parseFloat(data.open),
      previousClose: parseFloat(data.previous_close),
      volume: parseInt(data.volume),
      timestamp: Date.now()
    };
  }
  return null;
};

const fetchTwelveDataCandles = async (symbol: string, interval: string = '1day', outputsize: number = 365) => {
  const config = API_CONFIGS.twelveData;
  const url = `${config.baseUrl}${config.functions.timeSeries}?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${config.apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.values && data.values.length > 0) {
    const values = data.values.reverse(); // Twelve Data returns newest first
    return {
      s: 'ok',
      t: values.map((v: any) => new Date(v.datetime).getTime() / 1000),
      o: values.map((v: any) => parseFloat(v.open)),
      h: values.map((v: any) => parseFloat(v.high)),
      l: values.map((v: any) => parseFloat(v.low)),
      c: values.map((v: any) => parseFloat(v.close)),
      v: values.map((v: any) => parseInt(v.volume))
    };
  }
  return null;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, type = 'quote', symbol, resolution = 'D', from, to, outputsize } = await req.json();

    console.log(`[Stock API] Fetching ${type} data for symbols:`, symbols || symbol);

    // Handle different request types with multiple API fallbacks
    if (type === 'quote') {
      const quotes = [];

      for (const sym of symbols) {
        let quote = null;

        // Try Alpha Vantage first
        try {
          if (API_CONFIGS.alphaVantage.apiKey && API_CONFIGS.alphaVantage.apiKey !== 'demo') {
            quote = await fetchAlphaVantageQuote(sym);
            if (quote) console.log(`✅ Alpha Vantage success for ${sym}`);
          }
        } catch (error) {
          console.log(`❌ Alpha Vantage failed for ${sym}:`, error instanceof Error ? error.message : String(error));
        }

        // Try Twelve Data if Alpha Vantage failed
        if (!quote) {
          try {
            if (API_CONFIGS.twelveData.apiKey) {
              quote = await fetchTwelveDataQuote(sym);
              if (quote) console.log(`✅ Twelve Data success for ${sym}`);
            }
          } catch (error) {
            console.log(`❌ Twelve Data failed for ${sym}:`, error instanceof Error ? error.message : String(error));
          }
        }

        // Fall back to mock data
        if (!quote) {
          console.log(`📊 Using mock data for ${sym}`);
          quote = generateMockQuote(sym);
        }

        quotes.push(quote);
      }

      return new Response(JSON.stringify({ quotes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    else if (type === 'candles') {
      let candles = null;

      // Try Alpha Vantage first
      try {
        if (API_CONFIGS.alphaVantage.apiKey && API_CONFIGS.alphaVantage.apiKey !== 'demo') {
          candles = await fetchAlphaVantageCandles(symbol, outputsize === 'full' ? 'full' : 'compact');
        }
      } catch (error) {
        console.log(`Alpha Vantage candles failed for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }

      // Try Twelve Data if Alpha Vantage failed
      if (!candles) {
        try {
          if (API_CONFIGS.twelveData.apiKey) {
            const interval = resolution === 'D' ? '1day' : resolution === 'W' ? '1week' : '1day';
            candles = await fetchTwelveDataCandles(symbol, interval, outputsize === 'full' ? 2500 : 365);
          }
        } catch (error) {
          console.log(`Twelve Data candles failed for ${symbol}:`, error instanceof Error ? error.message : String(error));
        }
      }

      // Fall back to mock data
      if (!candles) {
        console.log(`Using mock candle data for ${symbol}`);
        candles = generateMockCandles(symbol, 365);
      }

      return new Response(JSON.stringify({ candles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    else if (type === 'profile') {
      // For now, return mock profile data
      const profile = {
        name: symbol,
        ticker: symbol,
        marketCapitalization: Math.floor(Math.random() * 1000000000000),
        shareOutstanding: Math.floor(Math.random() * 1000000000),
        logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
        weburl: `https://${symbol.toLowerCase()}.com`,
        exchange: 'NASDAQ',
        ipo: '1990-01-01',
        country: 'US',
        currency: 'USD',
        finnhubIndustry: 'Technology'
      };

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    else if (type === 'news') {
      // Return mock news data
      const news = Array.from({ length: 10 }, (_, i) => ({
        headline: `${symbol} Reports ${['Strong Q4 Earnings', 'Strategic Partnership', 'Product Launch', 'Market Expansion'][i % 4]}`,
        summary: `Latest developments from ${symbol} show positive momentum in the market.`,
        source: ['Bloomberg', 'Reuters', 'CNBC', 'WSJ'][i % 4],
        url: `https://example.com/news/${symbol}-${i}`,
        datetime: Date.now() - (i * 24 * 60 * 60 * 1000),
        image: `https://images.unsplash.com/photo-${150000000000 + i}?q=80&w=400`
      }));

      return new Response(JSON.stringify({ news }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    else if (type === 'search') {
      // Return mock search results
      const results = {
        result: [
          {
            symbol: symbol.toUpperCase(),
            description: `${symbol.toUpperCase()} Corporation`,
            displaySymbol: symbol.toUpperCase(),
            type: 'Common Stock'
          }
        ]
      };

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid request type');
  } catch (error) {
    console.error('[Stock API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return mock data as ultimate fallback
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { type, symbols, symbol } = body;

      if (type === 'quote' && symbols) {
        const quotes = symbols.map((sym: string) => generateMockQuote(sym));
        return new Response(JSON.stringify({ quotes }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (type === 'candles' && symbol) {
        const candles = generateMockCandles(symbol);
        return new Response(JSON.stringify({ candles }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
