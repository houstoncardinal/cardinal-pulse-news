import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Clock, 
  Eye,
  Sparkles 
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  views_count: number;
}

interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  search_volume: number;
  processed: boolean;
  created_at: string;
}

export const AdminDashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch articles
    const { data: articlesData } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (articlesData) setArticles(articlesData);

    // Fetch trending topics
    const { data: topicsData } = await supabase
      .from('trending_topics')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(20);

    if (topicsData) setTopics(topicsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAutomation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trends');
      
      if (error) throw error;
      
      toast({
        title: "Automation Triggered!",
        description: `${data.topicsAdded} new trending topics found. Articles are being generated automatically.`,
      });
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchData();
        setLoading(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger automation",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const publishArticle = async (articleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('publish-article', {
        body: { articleId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Article Published!",
        description: "The article is now live on your site.",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish article",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'pending_review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your autonomous news network</p>
        </div>
        <Button 
          size="lg" 
          onClick={triggerAutomation} 
          disabled={loading}
          className="gap-2"
        >
          <Sparkles className="h-5 w-5" />
          {loading ? 'Processing...' : 'Run Automation Now'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="luxury-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trending Topics</p>
              <p className="text-2xl font-bold">{topics.length}</p>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
              <p className="text-2xl font-bold">{articles.length}</p>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">
                {articles.filter(a => a.status === 'published').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">
                {articles.filter(a => a.status === 'pending_review').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="trending">Trending Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="luxury-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(article.status)}>
                        {article.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">{article.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views_count.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                  {article.status === 'pending_review' && (
                    <Button onClick={() => publishArticle(article.id)}>
                      Publish Now
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="space-y-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="luxury-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={topic.processed ? "default" : "secondary"}>
                        {topic.processed ? 'Processed' : 'Pending'}
                      </Badge>
                      <Badge variant="outline">{topic.category}</Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{topic.topic}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {topic.search_volume?.toLocaleString()} searches
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
