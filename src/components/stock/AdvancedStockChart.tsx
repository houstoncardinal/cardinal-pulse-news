import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickSeriesPartialOptions, LineSeriesPartialOptions, AreaSeriesPartialOptions, HistogramSeriesPartialOptions } from "lightweight-charts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Loader2 } from "lucide-react";

interface AdvancedStockChartProps {
  symbol: string;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number;
}

export const AdvancedStockChart = ({ symbol }: AdvancedStockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<'1' | '5' | '15' | '60' | 'D' | 'W'>('D');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');

  const fetchHistoricalData = async (resolution: string) => {
    try {
      setLoading(true);
      const to = Math.floor(Date.now() / 1000);
      const from = to - (resolution === 'D' ? 365 : resolution === 'W' ? 730 : 7) * 24 * 60 * 60;

      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: {
          symbol,
          resolution,
          from,
          to,
          type: 'candles'
        }
      });

      if (error) throw error;

      if (data?.candles && data.candles.s === 'ok') {
        const candleData: CandleData[] = data.candles.t.map((time: number, index: number) => ({
          time: new Date(time * 1000).toISOString().split('T')[0],
          open: data.candles.o[index],
          high: data.candles.h[index],
          low: data.candles.l[index],
          close: data.candles.c[index],
          value: data.candles.v[index]
        }));

        updateChart(candleData);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (data: CandleData[]) => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    // Update candlestick/line/area series
    if (chartType === 'candlestick') {
      candlestickSeriesRef.current.setData(data as any);
    } else {
      const lineData = data.map(d => ({ time: d.time, value: d.close }));
      candlestickSeriesRef.current.setData(lineData as any);
    }

    // Update volume series
    const volumeData = data.map(d => ({
      time: d.time,
      value: d.value || 0,
      color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    }));
    volumeSeriesRef.current.setData(volumeData as any);

    chartRef.current.timeScale().fitContent();
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      crosshair: {
        mode: 1 as any,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create main series based on chart type
    let mainSeries: any;
    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries('Candlestick' as any, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      } as CandlestickSeriesPartialOptions);
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries('Line' as any, {
        color: '#3b82f6',
        lineWidth: 2,
      } as LineSeriesPartialOptions);
    } else {
      mainSeries = chart.addSeries('Area' as any, {
        topColor: 'rgba(59, 130, 246, 0.56)',
        bottomColor: 'rgba(59, 130, 246, 0.04)',
        lineColor: 'rgba(59, 130, 246, 1)',
        lineWidth: 2,
      } as AreaSeriesPartialOptions);
    }

    // Create volume series
    const volumeSeries = chart.addSeries('Histogram' as any, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    } as HistogramSeriesPartialOptions);

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = mainSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    fetchHistoricalData(timeframe);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, chartType]);

  useEffect(() => {
    if (chartRef.current) {
      fetchHistoricalData(timeframe);
    }
  }, [timeframe]);

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {symbol} - Advanced Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="candlestick" className="text-xs">Candles</TabsTrigger>
                <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
                <TabsTrigger value="area" className="text-xs">Area</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['1', '5', '15', '60', 'D', 'W'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf as any)}
              className="h-8 px-3"
            >
              {tf === '1' ? '1m' : tf === '5' ? '5m' : tf === '15' ? '15m' : 
               tf === '60' ? '1h' : tf === 'D' ? '1D' : '1W'}
            </Button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={chartContainerRef} className="w-full" />
        </div>

        {/* Chart Info */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span>Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Real-time Data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
