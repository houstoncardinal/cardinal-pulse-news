import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, TrendingUp, Sparkles, Search, Filter, Zap, Clock, BarChart3 } from "lucide-react";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const REGIONS = [
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'CA', label: '🇨🇦 Canada' },
];

const CATEGORIES = [
  'all',
  'world',
  'business',
  'technology',
  'sports',
  'entertainment',
  'science',
  'politics'
];

export const EnhancedTrendsPanel = () => {
  const { data: trends, isLoading, refetch } = useTrendingTopics();
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrends, setSelectedTrends] = useState<Set<string>>(new Set());
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshTrends = async () => {
    setIsRefreshing(true);
    toast.loading('Fetching latest trends from Google...');
    
    try {
      const { error } = await supabase.functions.invoke('fetch-trends', {
        body: { region: selectedRegion, limit: 50 }
      });

      if (error) throw error;
      
      await refetch();
      toast.success(`Latest trends loaded for ${REGIONS.find(r => r.value === selectedRegion)?.label}`);
    } catch (error) {
      console.error('Error fetching trends:', error);
      toast.error('Failed to fetch trends');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateArticle = async (trendId: string, topic: string) => {
    setGeneratingIds(prev => new Set(prev).add(trendId));
    
    try {
      const { error } = await supabase.functions.invoke('generate-article', {
        body: { trendingTopicId: trendId }
      });

      if (error) throw error;
      
      toast.success(`Generating article: ${topic}`);
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Failed to generate article');
    } finally {
      setGeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(trendId);
        return newSet;
      });
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedTrends.size === 0) {
      toast.error('Please select trends to generate');
      return;
    }

    toast.loading(`Generating ${selectedTrends.size} articles...`);
    let success = 0;

    for (const trendId of Array.from(selectedTrends)) {
      try {
        const { error } = await supabase.functions.invoke('generate-article', {
          body: { trendingTopicId: trendId }
        });
        if (!error) success++;
      } catch (error) {
        console.error('Error:', error);
      }
    }

    toast.success(`Generated ${success} articles`);
    setSelectedTrends(new Set());
  };

  const handleToggleSelect = (trendId: string) => {
    const newSelected = new Set(selectedTrends);
    if (newSelected.has(trendId)) {
      newSelected.delete(trendId);
    } else {
      newSelected.add(trendId);
    }
    setSelectedTrends(newSelected);
  };

  const filteredTrends = trends?.filter(trend => {
    const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      trend.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }) || [];

  const sortedTrends = [...filteredTrends].sort((a, b) => b.trend_strength - a.trend_strength);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Real-Time Trends Explorer</h2>
          <p className="text-muted-foreground">Powered by Google Trends • Live data from past 24 hours</p>
        </div>
        <Button 
          onClick={handleRefreshTrends} 
          disabled={isRefreshing}
          size="lg"
          className="gap-2"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Refresh Trends
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Region
            </label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(region => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Trends
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword..."
              className="w-full"
            />
          </div>
        </div>

        {selectedTrends.size > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedTrends.size} trend{selectedTrends.size !== 1 ? 's' : ''} selected
            </p>
            <Button onClick={handleBulkGenerate} className="gap-2">
              <Zap className="h-4 w-4" />
              Generate {selectedTrends.size} Article{selectedTrends.size !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sortedTrends.length}</p>
              <p className="text-xs text-muted-foreground">Active Trends</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {sortedTrends.filter(t => !t.processed).length}
              </p>
              <p className="text-xs text-muted-foreground">Ready to Generate</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {sortedTrends[0]?.search_volume ? 
                  (sortedTrends[0].search_volume / 1000).toFixed(0) + 'K+' : 
                  'N/A'
                }
              </p>
              <p className="text-xs text-muted-foreground">Top Search Volume</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">Live</p>
              <p className="text-xs text-muted-foreground">Last 24 Hours</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trends List */}
      <div className="space-y-3">
        {sortedTrends.map((trend, index) => (
          <Card 
            key={trend.id} 
            className="p-4 hover:shadow-lg transition-all animate-fade-in hover-scale"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start gap-4">
              <Checkbox
                checked={selectedTrends.has(trend.id)}
                onCheckedChange={() => handleToggleSelect(trend.id)}
                className="mt-1"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="font-semibold">
                        #{index + 1}
                      </Badge>
                      <Badge variant="outline">{trend.category}</Badge>
                      {trend.search_volume && (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {(trend.search_volume / 1000).toFixed(0)}K+ searches
                        </Badge>
                      )}
                      <Badge 
                        className="gap-1"
                        style={{
                          background: `hsl(${trend.trend_strength * 1.2}, 70%, 50%)`
                        }}
                      >
                        {trend.trend_strength}% Trending
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold mb-2 story-link">
                      {trend.topic}
                    </h3>

                    {trend.keywords && trend.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trend.keywords.slice(0, 8).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {trend.fetched_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(trend.fetched_at).toLocaleTimeString()}
                        </span>
                      )}
                      <span>Region: {trend.region}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleGenerateArticle(trend.id, trend.topic)}
                    disabled={trend.processed || generatingIds.has(trend.id)}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {generatingIds.has(trend.id) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : trend.processed ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generated
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Article
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedTrends.length === 0 && (
        <Card className="p-12 text-center">
          <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Trends Found</h3>
          <p className="text-muted-foreground mb-4">
            Try refreshing or changing your filters
          </p>
          <Button onClick={handleRefreshTrends}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Fetch Latest Trends
          </Button>
        </Card>
      )}
    </div>
  );
};
