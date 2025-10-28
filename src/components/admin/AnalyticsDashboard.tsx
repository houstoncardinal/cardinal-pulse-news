import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArticles } from "@/hooks/useArticles";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { BarChart3, Eye, TrendingUp, Clock, Zap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const AnalyticsDashboard = () => {
  const { data: articles } = useArticles();
  const { data: trends } = useTrendingTopics();

  // Calculate metrics
  const totalViews = articles?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0;
  const publishedArticles = articles?.filter(a => a.status === 'published').length || 0;
  const draftArticles = articles?.filter(a => a.status === 'draft').length || 0;
  const avgWordsPerArticle = articles?.reduce((sum, a) => sum + (a.word_count || 0), 0) / (articles?.length || 1) || 0;
  
  // Category breakdown
  const categoryStats = articles?.reduce((acc, article) => {
    const cat = article.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top performing articles
  const topArticles = [...(articles || [])]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);

  // Recent trends performance
  const activeTrends = trends?.filter(t => !t.processed).length || 0;
  const processedTrends = trends?.filter(t => t.processed).length || 0;

  // Time-based stats (last 7 days)
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentArticles = articles?.filter(a => 
    new Date(a.created_at) > last7Days
  ).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time performance metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {publishedArticles} published articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Library</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {publishedArticles} published • {draftArticles} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrends}</div>
            <p className="text-xs text-muted-foreground">
              {processedTrends} already processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentArticles}</div>
            <p className="text-xs text-muted-foreground">
              Articles published this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center gap-4">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {article.views_count || 0} views
                      <Badge variant="outline" className="ml-2">{article.category}</Badge>
                    </div>
                  </div>
                  <Progress 
                    value={(article.views_count || 0) / (topArticles[0]?.views_count || 1) * 100} 
                    className="w-24"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Article Length</span>
                  <span className="font-medium">{Math.round(avgWordsPerArticle)} words</span>
                </div>
                <Progress value={Math.min(avgWordsPerArticle / 15, 100)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Publishing Rate</span>
                  <span className="font-medium">
                    {publishedArticles > 0 ? Math.round((publishedArticles / (articles?.length || 1)) * 100) : 0}%
                  </span>
                </div>
                <Progress value={publishedArticles > 0 ? (publishedArticles / (articles?.length || 1)) * 100 : 0} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryStats && Object.entries(categoryStats)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{category}</span>
                      <span className="font-medium">{count} articles</span>
                    </div>
                    <Progress value={(count / (articles?.length || 1)) * 100} />
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Conversion Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Trends</p>
                  <p className="text-3xl font-bold text-primary">{activeTrends}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-3xl font-bold text-green-500">{processedTrends}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate</span>
                  <span className="font-medium">
                    {trends?.length ? Math.round((processedTrends / trends.length) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={trends?.length ? (processedTrends / trends.length) * 100 : 0} 
                />
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Top Trending Regions</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(trends?.map(t => t.region))).map(region => (
                    <Badge key={region} variant="outline">
                      {region}: {trends?.filter(t => t.region === region).length}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};