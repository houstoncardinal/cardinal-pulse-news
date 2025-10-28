import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useArticles } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle, Send, ArrowRight, Calendar, Eye } from "lucide-react";

export const ContentWorkflow = () => {
  const { data: articles = [], refetch } = useArticles();
  
  const columns = [
    { id: 'draft', title: 'Draft', icon: FileText, color: 'yellow' },
    { id: 'review', title: 'In Review', icon: Eye, color: 'blue' },
    { id: 'scheduled', title: 'Scheduled', icon: Calendar, color: 'purple' },
    { id: 'published', title: 'Published', icon: CheckCircle, color: 'green' },
  ];

  const getColumnArticles = (status: string) => {
    return articles.filter(a => {
      if (status === 'draft') return a.status === 'draft' || !a.status;
      if (status === 'published') return a.status === 'published';
      if (status === 'scheduled') return !a.published_at; // Articles not yet published
      if (status === 'review') return a.status === 'pending_review';
      return false;
    });
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId);

      if (error) throw error;

      toast.success(`Article moved to ${newStatus}`);
      refetch();
    } catch (error) {
      console.error('Error updating article status:', error);
      toast.error('Failed to update article status');
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
      blue: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
      purple: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
      green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
    };
    return colors[color] || colors.yellow;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Content Workflow</h2>
            <p className="text-sm text-muted-foreground">Drag and drop articles between stages</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnArticles = getColumnArticles(column.id);
          const Icon = column.icon;
          
          return (
            <Card key={column.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getColorClasses(column.color)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <Badge variant="outline">{columnArticles.length}</Badge>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {columnArticles.map(article => (
                  <Card
                    key={article.id}
                    className="p-3 hover:shadow-md transition-all cursor-move"
                  >
                    <h4 className="font-medium text-sm line-clamp-2 mb-2">
                      {article.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{article.category}</span>
                      <span>{article.read_time}</span>
                    </div>

                    {(article as any).views !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Eye className="h-3 w-3" />
                        {(article as any).views} views
                      </div>
                    )}

                    <div className="flex gap-1">
                      {column.id === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => handleStatusChange(article.id, 'pending_review')}
                        >
                          Send to Review
                        </Button>
                      )}
                      {column.id === 'review' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleStatusChange(article.id, 'draft')}
                          >
                            Back
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleStatusChange(article.id, 'published')}
                          >
                            Publish
                          </Button>
                        </>
                      )}
                      {column.id === 'scheduled' && (
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleStatusChange(article.id, 'published')}
                        >
                          Publish Now
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Workflow Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Workflow Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {columns.map(column => {
            const count = getColumnArticles(column.id).length;
            return (
              <div key={column.id} className="text-center">
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{column.title}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
