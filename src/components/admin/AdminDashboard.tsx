import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Clock, 
  Eye,
  Sparkles,
  Globe,
  Filter,
  Download,
  Zap,
  Image as ImageIcon,
  ExternalLink,
  Edit
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  category: string;
  status: string;
  created_at: string;
  views_count: number;
  image_url?: string;
  image_credit?: string;
  word_count?: number;
  sources?: any;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  tags?: string[];
  author?: string;
}

interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  search_volume: number;
  processed: boolean;
  created_at: string;
  region: string;
  trend_strength: number;
  keywords?: string[];
  related_queries?: string[];
  source_url?: string;
}

const REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'global', label: 'Global' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'EU', label: 'European Union' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
];

const CATEGORIES = [
  'all',
  'world',
  'business', 
  'technology',
  'sports',
  'entertainment',
  'science',
  'politics',
  'ai_innovation',
  'lifestyle'
];

export const AdminDashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [batchSize, setBatchSize] = useState(10);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        toast({
          title: "Error fetching articles",
          description: articlesError.message,
          variant: "destructive",
        });
      } else if (articlesData) {
        setArticles(articlesData);
      }

      // Fetch trending topics with filters
      let query = supabase
        .from('trending_topics')
        .select('*')
        .order('trend_strength', { ascending: false })
        .limit(100);

      if (selectedRegion !== 'all') {
        query = query.or(`region.eq.${selectedRegion},region.eq.global`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      const { data: topicsData, error: topicsError } = await query;

      if (topicsError) {
        console.error('Error fetching topics:', topicsError);
        toast({
          title: "Error fetching trends",
          description: topicsError.message,
          variant: "destructive",
        });
      } else if (topicsData) {
        console.log('Fetched topics:', topicsData.length);
        setTopics(topicsData);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRegion, selectedCategory]);

  const triggerAutomation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trends', {
        body: { region: selectedRegion === 'all' ? 'global' : selectedRegion, limit: batchSize }
      });
      
      if (error) throw error;
      
      toast({
        title: "🚀 Automation Triggered!",
        description: `${data.topicsAdded} trending topics found. Generating articles...`,
      });
      
      setTimeout(() => {
        fetchData();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger automation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSingleArticle = async (topicId: string, topicName: string) => {
    try {
      await supabase.functions.invoke('generate-article', {
        body: { trendingTopicId: topicId }
      });
      
      toast({
        title: "✨ Generating Article!",
        description: `Creating powerful article for "${topicName}"...`,
      });

      setTimeout(() => {
        fetchData();
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate article",
        variant: "destructive",
      });
    }
  };

  const generateBatchArticles = async () => {
    if (selectedTopics.size === 0) {
      toast({
        title: "No Topics Selected",
        description: "Please select at least one topic to generate articles.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const topicId of Array.from(selectedTopics)) {
        try {
          await supabase.functions.invoke('generate-article', {
            body: { trendingTopicId: topicId }
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to generate article for topic ${topicId}:`, error);
        }
      }

      toast({
        title: "✨ Batch Generation Complete!",
        description: `Successfully generated ${successCount} powerful articles with AI-generated images.`,
      });

      setSelectedTopics(new Set());
      setTimeout(() => {
        fetchData();
        setLoading(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Batch generation failed",
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
        title: "📰 Article Published!",
        description: "Article is now live with full SEO optimization.",
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

  const toggleTopicSelection = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'pending_review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const unprocessedTopics = topics.filter(t => !t.processed);
  const processedTopics = topics.filter(t => t.processed);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
            Autonomous News Engine
          </h1>
          <p className="text-muted-foreground">Powered by AI • Real-time Trends • Global Reach</p>
        </div>
        <div className="flex gap-3">
          <Input 
            type="number" 
            value={batchSize} 
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-20"
            min="1"
            max="50"
          />
          <Button 
            size="lg" 
            onClick={triggerAutomation} 
            disabled={loading}
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Processing...' : 'Scan Trends Now'}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="luxury-card p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold">Filters:</span>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(region => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTopics.size > 0 && (
            <Button onClick={generateBatchArticles} disabled={loading} className="gap-2">
              <Zap className="h-4 w-4" />
              Generate {selectedTopics.size} Articles
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="luxury-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Trends</p>
              <p className="text-2xl font-bold">{unprocessedTopics.length}</p>
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
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="trends">
            Trending Topics ({unprocessedTopics.length})
          </TabsTrigger>
          <TabsTrigger value="articles">
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedTopics.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <div className="space-y-4">
            {unprocessedTopics.length === 0 ? (
              <Card className="luxury-card p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <TrendingUp className="h-16 w-16 text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">No Unprocessed Trends</h3>
                    <p className="text-muted-foreground">Click "Scan Trends Now" to fetch trending topics</p>
                  </div>
                </div>
              </Card>
            ) : (
              unprocessedTopics.map((topic) => (
                <Card 
                  key={topic.id} 
                  className={`luxury-card p-6 transition-all ${
                    selectedTopics.has(topic.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={selectedTopics.has(topic.id) ? "default" : "secondary"}>
                          {selectedTopics.has(topic.id) ? '✓ Selected' : 'Available'}
                        </Badge>
                        <Badge variant="outline">{topic.category}</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          {topic.region}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-primary to-red-400 text-white">
                          {topic.trend_strength}% Strength
                        </Badge>
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2">{topic.topic}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {topic.search_volume?.toLocaleString()} searches
                        </span>
                      </div>
                      {topic.keywords && topic.keywords.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                          {topic.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              #{kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {topic.related_queries && topic.related_queries.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Related:</span> {topic.related_queries.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => generateSingleArticle(topic.id, topic.topic)}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Article
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTopicSelection(topic.id)}
                      >
                        {selectedTopics.has(topic.id) ? 'Deselect' : 'Select'}
                      </Button>
                      {topic.source_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={topic.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <div className="space-y-4">
            {articles.length === 0 ? (
              <Card className="luxury-card p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">No Articles Yet</h3>
                    <p className="text-muted-foreground">Generate articles from trending topics to see them here</p>
                  </div>
                </div>
              </Card>
            ) : (
              articles.map((article) => (
                <Card key={article.id} className="luxury-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    {article.image_url && (
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-40 h-32 object-cover rounded-lg shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(article.status) + " text-white"}>
                          {article.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{article.category}</Badge>
                        {article.word_count && (
                          <Badge variant="secondary">
                            {article.word_count.toLocaleString()} words
                          </Badge>
                        )}
                        {article.image_url && (
                          <Badge variant="secondary" className="gap-1">
                            <ImageIcon className="h-3 w-3" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2">{article.title}</h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views_count.toLocaleString()} views
                        </span>
                        {article.sources && Array.isArray(article.sources) && article.sources.length > 0 && (
                          <span className="font-semibold">{article.sources.length} sources cited</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setEditingArticle(article)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      {article.status === 'pending_review' && (
                        <Button onClick={() => publishArticle(article.id)} className="gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Publish
                        </Button>
                      )}
                      {article.status === 'published' && (
                        <Button variant="outline" asChild>
                          <a href={`/article/${article.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Live
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="processed">
          <div className="space-y-4">
            {processedTopics.map((topic) => (
              <Card key={topic.id} className="luxury-card p-6 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge>Processed</Badge>
                      <Badge variant="outline">{topic.category}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {topic.region}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">{topic.topic}</h3>
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

      {editingArticle && (
        <ArticleEditor
          article={editingArticle}
          isOpen={!!editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={() => {
            fetchData();
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
};