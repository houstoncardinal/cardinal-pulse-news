import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Advanced technical indicators
const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (prices: number[]): { macd: number; signal: number; histogram: number } => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([...Array(9)].map((_, i) => prices[prices.length - 9 + i]), 9);
  
  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round((macd - signal) * 100) / 100
  };
};

const calculateEMA = (prices: number[], period: number): number => {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: Math.round((sma + stdDev * std) * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round((sma - stdDev * std) * 100) / 100,
    bandwidth: Math.round(((stdDev * std * 2) / sma * 100) * 100) / 100
  };
};

const calculateVolatility = (prices: number[], period: number = 30): number => {
  if (prices.length < period) return 0;
  
  const returns = [];
  for (let i = 1; i < period; i++) {
    returns.push((prices[prices.length - i] - prices[prices.length - i - 1]) / prices[prices.length - i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.round(Math.sqrt(variance) * Math.sqrt(252) * 100 * 100) / 100; // Annualized
};

const calculateSharpeRatio = (prices: number[], riskFreeRate: number = 0.02): number => {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.round(((avgReturn * 252 - riskFreeRate) / (stdDev * Math.sqrt(252))) * 100) / 100;
};

const generateTradingSignals = (
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  bollingerBands: any,
  currentPrice: number
): string[] => {
  const signals: string[] = [];
  
  // RSI signals
  if (rsi < 30) signals.push("🟢 OVERSOLD (RSI < 30) - Potential BUY opportunity");
  if (rsi > 70) signals.push("🔴 OVERBOUGHT (RSI > 70) - Consider taking profits");
  if (rsi > 40 && rsi < 60) signals.push("⚪ NEUTRAL RSI - No strong directional bias");
  
  // MACD signals
  if (macd.macd > macd.signal && macd.histogram > 0) {
    signals.push("🟢 BULLISH MACD - Momentum shifting upward");
  } else if (macd.macd < macd.signal && macd.histogram < 0) {
    signals.push("🔴 BEARISH MACD - Momentum shifting downward");
  }
  
  // Bollinger Band signals
  if (currentPrice <= bollingerBands.lower) {
    signals.push("🟢 TOUCHING LOWER BAND - Potential bounce");
  } else if (currentPrice >= bollingerBands.upper) {
    signals.push("🔴 TOUCHING UPPER BAND - Potential resistance");
  }
  
  if (bollingerBands.bandwidth < 10) {
    signals.push("⚠️ BOLLINGER SQUEEZE - Volatility breakout expected");
  }
  
  return signals;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, historicalPrices } = await req.json();
    
    if (!historicalPrices || historicalPrices.length < 30) {
      throw new Error('Insufficient historical data for analysis');
    }
    
    console.log(`📊 Performing advanced analytics for ${symbol}`);
    
    // Calculate all technical indicators
    const rsi = calculateRSI(historicalPrices);
    const macd = calculateMACD(historicalPrices);
    const bollingerBands = calculateBollingerBands(historicalPrices);
    const volatility = calculateVolatility(historicalPrices);
    const sharpeRatio = calculateSharpeRatio(historicalPrices);
    
    const currentPrice = historicalPrices[historicalPrices.length - 1];
    const signals = generateTradingSignals(rsi, macd, bollingerBands, currentPrice);
    
    // Calculate support and resistance levels
    const recentPrices = historicalPrices.slice(-60);
    const sortedPrices = [...recentPrices].sort((a, b) => a - b);
    const support = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
    
    // Price momentum
    const priceChange30d = ((currentPrice - historicalPrices[historicalPrices.length - 30]) / historicalPrices[historicalPrices.length - 30] * 100);
    const priceChange90d = historicalPrices.length >= 90 
      ? ((currentPrice - historicalPrices[historicalPrices.length - 90]) / historicalPrices[historicalPrices.length - 90] * 100)
      : null;
    
    // Overall market sentiment
    let sentiment = "NEUTRAL";
    let sentimentScore = 0;
    
    if (rsi < 30) sentimentScore += 2;
    if (rsi > 70) sentimentScore -= 2;
    if (macd.histogram > 0) sentimentScore += 1;
    if (macd.histogram < 0) sentimentScore -= 1;
    if (currentPrice < bollingerBands.lower) sentimentScore += 1;
    if (currentPrice > bollingerBands.upper) sentimentScore -= 1;
    
    if (sentimentScore >= 2) sentiment = "BULLISH";
    if (sentimentScore <= -2) sentiment = "BEARISH";
    
    console.log(`✅ Analytics complete: ${symbol} - ${sentiment}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        analytics: {
          technicalIndicators: {
            rsi: Math.round(rsi * 100) / 100,
            macd,
            bollingerBands,
            volatility,
            sharpeRatio
          },
          priceAction: {
            currentPrice,
            support: Math.round(support * 100) / 100,
            resistance: Math.round(resistance * 100) / 100,
            change30d: Math.round(priceChange30d * 100) / 100,
            change90d: priceChange90d ? Math.round(priceChange90d * 100) / 100 : null
          },
          signals,
          sentiment: {
            overall: sentiment,
            score: sentimentScore,
            confidence: Math.abs(sentimentScore) >= 3 ? "HIGH" : Math.abs(sentimentScore) >= 2 ? "MEDIUM" : "LOW"
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
