import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AdvancedArticleEditor } from "./AdvancedArticleEditor";
import { 
  Search, Filter, Trash2, Eye, Edit, CheckSquare, 
  Calendar, TrendingUp, Clock, History, MoreVertical,
  Download, Archive, RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ArticleManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedArticleHistory, setSelectedArticleHistory] = useState<any>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['all-articles', searchTerm, statusFilter, categoryFilter, sortBy],
    queryFn: async () => {
      let query = supabase.from('articles').select('*');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'published' | 'pending_review' | 'archived');
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as 'world' | 'business' | 'technology' | 'sports' | 'entertainment' | 'science' | 'lifestyle' | 'politics' | 'ai_innovation');
      }

      const [column, direction] = sortBy.includes('_') 
        ? [sortBy.split('_')[0], sortBy.split('_')[1] === 'desc']
        : [sortBy, true];

      query = query.order(column, { ascending: !direction });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: articleHistory } = useQuery({
    queryKey: ['article-history', selectedArticleHistory?.id],
    queryFn: async () => {
      if (!selectedArticleHistory?.id) return [];
      
      const { data, error } = await supabase
        .from('article_history')
        .select('*')
        .eq('article_id', selectedArticleHistory.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedArticleHistory?.id,
  });

  const toggleArticleSelection = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const selectAll = () => {
    if (selectedArticles.size === articles?.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles?.map(a => a.id) || []));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.size === 0) return;
    
    if (!confirm(`Delete ${selectedArticles.size} article(s)? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', Array.from(selectedArticles));

      if (error) throw error;

      toast.success(`Deleted ${selectedArticles.size} article(s)`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    } catch (error: any) {
      toast.error('Failed to delete articles: ' + error.message);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedArticles.size === 0) return;

    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedArticles));

      if (error) throw error;

      toast.success(`Published ${selectedArticles.size} article(s)`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    } catch (error: any) {
      toast.error('Failed to publish articles: ' + error.message);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedArticles.size === 0) return;

    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'draft' })
        .in('id', Array.from(selectedArticles));

      if (error) throw error;

      toast.success(`Unpublished ${selectedArticles.size} article(s)`);
      setSelectedArticles(new Set());
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    } catch (error: any) {
      toast.error('Failed to unpublish articles: ' + error.message);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      toast.success('Article deleted');
      queryClient.invalidateQueries({ queryKey: ['all-articles'] });
    } catch (error: any) {
      toast.error('Failed to delete article: ' + error.message);
    }
  };

  const viewHistory = (article: any) => {
    setSelectedArticleHistory(article);
    setHistoryDialogOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (editingArticle) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setEditingArticle(null)}>
          ← Back to Management
        </Button>
        <AdvancedArticleEditor
          article={editingArticle}
          isOpen={true}
          onClose={() => {
            setEditingArticle(null);
            queryClient.invalidateQueries({ queryKey: ['all-articles'] });
          }}
          onSave={() => {
            setEditingArticle(null);
            queryClient.invalidateQueries({ queryKey: ['all-articles'] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="world">World</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="health">Health</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="published_at_desc">Recently Published</SelectItem>
                <SelectItem value="views_count_desc">Most Viewed</SelectItem>
                <SelectItem value="title_asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedArticles.size > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-primary/5 rounded-lg">
              <Badge variant="secondary">{selectedArticles.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={handleBulkPublish}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>
                <Archive className="h-4 w-4 mr-2" />
                Unpublish
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {articles?.length || 0} Articles
            </h3>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedArticles.size === articles?.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
          ) : articles?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No articles found</div>
          ) : (
            <div className="space-y-2">
              {articles?.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedArticles.has(article.id)}
                    onCheckedChange={() => toggleArticleSelection(article.id)}
                  />
                  
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{article.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views_count || 0}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.read_time}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.created_at)}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingArticle(article)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => viewHistory(article)}>
                        <History className="h-4 w-4 mr-2" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Article History</DialogTitle>
            <DialogDescription>
              Complete history for: {selectedArticleHistory?.title}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {articleHistory?.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{entry.action}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>
                      <p className="text-sm">{entry.change_summary}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {!articleHistory || articleHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No history available
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
