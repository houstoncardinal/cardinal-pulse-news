import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useArticles } from "@/hooks/useArticles";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { Activity, Eye, TrendingUp, Zap, Users, Clock, Target, BarChart3 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RealtimeMetrics = () => {
  const { data: articles = [] } = useArticles();
  const { data: topics = [] } = useTrendingTopics();
  const [liveStats, setLiveStats] = useState({
    activeUsers: 0,
    viewsLastHour: 0,
    avgSessionTime: 0,
    bounceRate: 0,
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats({
        activeUsers: Math.floor(Math.random() * 150) + 50,
        viewsLastHour: Math.floor(Math.random() * 500) + 200,
        avgSessionTime: Math.floor(Math.random() * 180) + 120,
        bounceRate: Math.floor(Math.random() * 30) + 20,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const recentArticles = articles
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Generate sample time-series data
  const generateTimeSeriesData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i}h`,
      views: Math.floor(Math.random() * 100) + 50,
      engagement: Math.floor(Math.random() * 80) + 40,
    }));
  };

  const timeSeriesData = generateTimeSeriesData();

  return (
    <div className="space-y-6">
      {/* Live Stats Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Live Metrics</h2>
              <p className="text-sm text-muted-foreground">Real-time performance monitoring</p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
        </div>
      </Card>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>
          <p className="text-3xl font-bold mb-1">{liveStats.activeUsers}</p>
          <p className="text-sm text-muted-foreground">Active Users</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>+12% from avg</span>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <Badge variant="outline" className="text-xs">1h</Badge>
          </div>
          <p className="text-3xl font-bold mb-1">{liveStats.viewsLastHour}</p>
          <p className="text-sm text-muted-foreground">Views (Last Hour)</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>+8% from previous</span>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <Badge variant="outline" className="text-xs">Avg</Badge>
          </div>
          <p className="text-3xl font-bold mb-1">{Math.floor(liveStats.avgSessionTime / 60)}:{(liveStats.avgSessionTime % 60).toString().padStart(2, '0')}</p>
          <p className="text-sm text-muted-foreground">Avg Session Time</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>+5% improvement</span>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Target className="h-5 w-5 text-red-600" />
            </div>
            <Badge variant="outline" className="text-xs">Rate</Badge>
          </div>
          <p className="text-3xl font-bold mb-1">{liveStats.bounceRate}%</p>
          <p className="text-sm text-muted-foreground">Bounce Rate</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3 rotate-180" />
            <span>-3% (better)</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Hourly Views
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Engagement Rate
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="engagement" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Performing Articles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Performing (Last 24h)
        </h3>
        <div className="space-y-3">
          {recentArticles.map((article, index) => (
            <div key={article.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{article.title}</h4>
                <p className="text-sm text-muted-foreground">{article.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Eye className="h-4 w-4" />
                    {(article as any).views || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
