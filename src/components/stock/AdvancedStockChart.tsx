import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickSeriesPartialOptions, LineSeriesPartialOptions, AreaSeriesPartialOptions, HistogramSeriesPartialOptions } from "lightweight-charts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Loader2 } from "lucide-react";

interface AdvancedStockChartProps {
  symbols: string[];
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number;
}

export const AdvancedStockChart = ({ symbols }: AdvancedStockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, any>>(new Map());
  const volumeSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<'1' | '5' | '15' | '60' | 'D' | 'W'>('D');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('line');
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  
  const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

  const calculateMA = (data: number[], period: number): number[] => {
    const ma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ma.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        ma.push(sum / period);
      }
    }
    return ma;
  };

  const fetchHistoricalData = async (symbol: string, resolution: string, colorIndex: number) => {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - (resolution === 'D' ? 365 : resolution === 'W' ? 730 : 7) * 24 * 60 * 60;

      console.log(`Fetching historical data for ${symbol}, resolution: ${resolution}`);

      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: {
          symbol,
          resolution,
          from,
          to,
          type: 'candles'
        }
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Received candles data:', data);

      if (data?.candles && data.candles.s === 'ok' && data.candles.t && data.candles.t.length > 0) {
        const candleData: CandleData[] = data.candles.t.map((time: number, index: number) => ({
          time: new Date(time * 1000).toISOString().split('T')[0],
          open: data.candles.o[index],
          high: data.candles.h[index],
          low: data.candles.l[index],
          close: data.candles.c[index],
          value: data.candles.v[index]
        })).filter(d => d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0);

        console.log(`Processed ${candleData.length} candles for ${symbol}`);
        return { symbol, data: candleData, color: CHART_COLORS[colorIndex] };
      } else {
        console.warn(`No valid candle data for ${symbol}:`, data?.candles);
      }
    } catch (error) {
      console.error('Error fetching historical data for', symbol, ':', error);
    }
    return null;
  };

  const fetchAllData = async (resolution: string) => {
    try {
      setLoading(true);
      const results = await Promise.all(
        symbols.map((symbol, index) => fetchHistoricalData(symbol, resolution, index))
      );
      
      const validResults = results.filter(r => r !== null);
      if (validResults.length > 0) {
        updateChart(validResults as any);
      }
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (results: Array<{ symbol: string; data: CandleData[]; color: string }>) => {
    if (!chartRef.current || results.length === 0) {
      console.warn('Cannot update chart - no chart or no results');
      return;
    }

    console.log('Updating chart with results:', results.map(r => ({ symbol: r.symbol, dataPoints: r.data.length })));

    // Clear existing series
    seriesRefs.current.forEach(series => {
      try {
        if (series && chartRef.current) chartRef.current.removeSeries(series);
      } catch (e) {
        console.warn('Error removing series:', e);
      }
    });
    seriesRefs.current.clear();

    if (volumeSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      } catch (e) {
        console.warn('Error removing volume series:', e);
      }
    }

    results.forEach(({ symbol, data, color }) => {
      if (data.length === 0) {
        console.warn(`No data for ${symbol}, skipping`);
        return;
      }

      try {
        if (chartType === 'candlestick' && results.length === 1) {
          const series = chartRef.current!.addSeries('Candlestick' as any, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
          } as CandlestickSeriesPartialOptions);
          series.setData(data as any);
          seriesRefs.current.set(symbol, series);
          console.log(`Added candlestick series for ${symbol} with ${data.length} data points`);
        } else {
          const lineData = data.map(d => ({ time: d.time, value: d.close }));
          
          if (chartType === 'area') {
            const series = chartRef.current!.addSeries('Area' as any, {
              topColor: `${color}80`,
              bottomColor: `${color}10`,
              lineColor: color,
              lineWidth: 2,
            } as AreaSeriesPartialOptions);
            series.setData(lineData as any);
            seriesRefs.current.set(symbol, series);
            console.log(`Added area series for ${symbol} with ${lineData.length} data points`);
          } else {
            const series = chartRef.current!.addSeries('Line' as any, {
              color: color,
              lineWidth: 2,
              title: symbol,
            } as LineSeriesPartialOptions);
            series.setData(lineData as any);
            seriesRefs.current.set(symbol, series);
            console.log(`Added line series for ${symbol} with ${lineData.length} data points`);
          }
        }
      } catch (error) {
        console.error(`Error adding series for ${symbol}:`, error);
      }

        // Add moving averages if enabled
        if (showMA && results.length === 1 && chartType !== 'candlestick') {
          try {
            const closes = data.map(d => d.close);
            const ma20 = calculateMA(closes, 20);
            const ma50 = calculateMA(closes, 50);

            const ma20Data = data.map((d, i) => ({ time: d.time, value: ma20[i] })).filter(d => !isNaN(d.value));
            const ma50Data = data.map((d, i) => ({ time: d.time, value: ma50[i] })).filter(d => !isNaN(d.value));

            if (ma20Data.length > 0) {
              const ma20Series = chartRef.current!.addSeries('Line' as any, {
                color: 'rgba(255, 152, 0, 0.8)',
                lineWidth: 1,
                title: 'MA20',
              } as LineSeriesPartialOptions);
              ma20Series.setData(ma20Data as any);
            }

            if (ma50Data.length > 0) {
              const ma50Series = chartRef.current!.addSeries('Line' as any, {
                color: 'rgba(156, 39, 176, 0.8)',
                lineWidth: 1,
                title: 'MA50',
              } as LineSeriesPartialOptions);
              ma50Series.setData(ma50Data as any);
            }
          } catch (error) {
            console.error('Error adding MA lines:', error);
          }
        }

      // Update volume series (only for first symbol)
      if (results.length === 1 && results[0].symbol === symbol && showVolume && data.length > 0) {
        try {
          const volumeSeries = chartRef.current!.addSeries('Histogram' as any, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
          } as HistogramSeriesPartialOptions);

          const volumeData = data.map(d => ({
            time: d.time,
            value: d.value || 0,
            color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
          }));
          volumeSeries.setData(volumeData as any);
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.7, bottom: 0 },
          });
          volumeSeriesRef.current = volumeSeries;
          console.log(`Added volume series with ${volumeData.length} data points`);
        } catch (error) {
          console.error('Error adding volume series:', error);
        }
      }
    });

    try {
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error('Error fitting content:', error);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--muted-foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border) / 0.2)' },
        horzLines: { color: 'hsl(var(--border) / 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 700,
      crosshair: {
        mode: 1 as any,
        vertLine: {
          width: 2,
          color: 'hsl(var(--primary) / 0.5)',
          style: 0,
          labelBackgroundColor: 'hsl(var(--primary))',
        },
        horzLine: {
          width: 2,
          color: 'hsl(var(--primary) / 0.5)',
          style: 0,
          labelBackgroundColor: 'hsl(var(--primary))',
        },
      },
      rightPriceScale: {
        borderColor: 'hsl(var(--border))',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'hsl(var(--border))',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    fetchAllData(timeframe);

    return () => {
      window.removeEventListener('resize', handleResize);
      seriesRefs.current.forEach(series => {
        if (series) chart.removeSeries(series);
      });
      seriesRefs.current.clear();
      chart.remove();
    };
  }, [symbols.join(','), chartType, showMA, showVolume]);

  useEffect(() => {
    if (chartRef.current) {
      fetchAllData(timeframe);
    }
  }, [timeframe]);

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Interactive Chart - {symbols.join(', ')}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {symbols.length === 1 && (
              <>
                <Button
                  variant={showMA ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMA(!showMA)}
                  className="h-8 px-3 text-xs"
                >
                  MA Lines
                </Button>
                <Button
                  variant={showVolume ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                  className="h-8 px-3 text-xs"
                >
                  Volume
                </Button>
              </>
            )}
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-auto">
              <TabsList className="h-8">
                {symbols.length === 1 && <TabsTrigger value="candlestick" className="text-xs">Candles</TabsTrigger>}
                <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
                <TabsTrigger value="area" className="text-xs">Area</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <span className="text-sm text-muted-foreground mr-2">Timeframe:</span>
          {['1', '5', '15', '60', 'D', 'W'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf as any)}
              className="h-8 px-3 text-xs"
            >
              {tf === '1' ? '1m' : tf === '5' ? '5m' : tf === '15' ? '15m' : 
               tf === '60' ? '1h' : tf === 'D' ? '1D' : '1W'}
            </Button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="relative bg-muted/20 rounded-lg p-2">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full rounded-lg" />
        </div>

        {/* Chart Legend & Info */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              <span>Bearish</span>
            </div>
            {showMA && symbols.length === 1 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255, 152, 0, 0.8)' }} />
                  <span>MA20</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(156, 39, 176, 0.8)' }} />
                  <span>MA50</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Live Market Data</span>
          </div>
        </div>

        {/* Pro Features */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro Tip:</strong> Use mouse wheel to zoom, drag to pan, and click to see crosshair details. 
            {symbols.length < 3 && " Compare up to 3 stocks simultaneously!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
