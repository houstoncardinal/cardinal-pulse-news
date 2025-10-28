import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArticles } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, CheckCircle, Archive, Tag, Loader2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const BatchOperations = () => {
  const { data: articles } = useArticles();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredArticles = articles?.filter(article => {
    const statusMatch = filterStatus === "all" || article.status === filterStatus;
    const categoryMatch = filterCategory === "all" || article.category === filterCategory;
    return statusMatch && categoryMatch;
  }) || [];

  const categories = Array.from(new Set(articles?.map(a => a.category)));

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map(a => a.id)));
    }
  };

  const handleBatchPublish = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'published', 
          published_at: new Date().toISOString() 
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`Published ${selectedIds.size} articles`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to publish articles');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`Deleted ${selectedIds.size} articles`);
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete articles');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchCategoryChange = async (category: string) => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({ category: category as any })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`Updated category for ${selectedIds.size} articles`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update categories');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Batch Operations</h2>
          <p className="text-muted-foreground">Manage multiple articles efficiently</p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Filter</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category Filter</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={selectAll}
                  variant="outline"
                  className="w-full"
                >
                  {selectedIds.size === filteredArticles.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-base px-3 py-1">
                    {selectedIds.size} Selected
                  </Badge>
                  <Button
                    onClick={() => setSelectedIds(new Set())}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleBatchPublish}
                    disabled={isProcessing}
                    size="sm"
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Publish
                  </Button>

                  <Select onValueChange={handleBatchCategoryChange}>
                    <SelectTrigger className="w-[140px]" disabled={isProcessing}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Category
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <div className="grid gap-3">
        {filteredArticles.map((article) => (
          <Card 
            key={article.id}
            className={`transition-all ${selectedIds.has(article.id) ? 'ring-2 ring-primary' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.has(article.id)}
                  onCheckedChange={() => toggleSelect(article.id)}
                />

                {article.image_url && (
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{article.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                      {article.status}
                    </Badge>
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {article.views_count || 0} views
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {new Date(article.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No articles found matching your filters</p>
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} article{selectedIds.size !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive">
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};