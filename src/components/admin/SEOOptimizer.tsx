import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useArticles } from "@/hooks/useArticles";
import { Search, TrendingUp, Award, AlertCircle, CheckCircle2, XCircle, Zap } from "lucide-react";

export const SEOOptimizer = () => {
  const { data: articles = [] } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const calculateSEOScore = (article: any) => {
    let score = 0;
    const checks = {
      hasTitle: !!article.title && article.title.length >= 30 && article.title.length <= 60,
      hasMetaDescription: !!article.meta_description && article.meta_description.length >= 120 && article.meta_description.length <= 160,
      hasMetaKeywords: !!article.meta_keywords && article.meta_keywords.length > 0,
      hasImage: !!article.featured_image || !!article.image_url,
      hasSEOSlug: !!article.slug && article.slug.length > 5,
      hasReadTime: !!article.read_time,
      hasCategory: !!article.category,
      hasAuthor: !!article.author,
      contentLength: article.content && article.content.length > 1000,
    };

    Object.values(checks).forEach(check => { if (check) score += 11; });
    return { score: Math.min(score, 100), checks };
  };

  const recentArticles = articles
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(article => ({
      ...article,
      seoData: calculateSEOScore(article)
    }));

  const avgScore = recentArticles.reduce((sum, a) => sum + a.seoData.score, 0) / recentArticles.length || 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg SEO Score</p>
              <p className="text-2xl font-bold">{avgScore.toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Optimized</p>
              <p className="text-2xl font-bold">
                {recentArticles.filter(a => a.seoData.score >= 80).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Work</p>
              <p className="text-2xl font-bold">
                {recentArticles.filter(a => a.seoData.score < 80 && a.seoData.score >= 50).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold">
                {recentArticles.filter(a => a.seoData.score < 50).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Articles List */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SEO Analysis</h2>
            <p className="text-sm text-muted-foreground">Recent articles performance</p>
          </div>
        </div>

        <div className="space-y-3">
          {recentArticles.map(article => (
            <Card
              key={article.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedArticle(selectedArticle?.id === article.id ? null : article)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {article.category} • {article.read_time || 'N/A'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      article.seoData.score >= 80 ? 'text-green-600' :
                      article.seoData.score >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {article.seoData.score}%
                    </div>
                    <Progress value={article.seoData.score} className="w-20 h-2" />
                  </div>
                  
                  {article.seoData.score >= 80 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : article.seoData.score >= 50 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>

              {selectedArticle?.id === article.id && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="text-sm font-semibold mb-3">SEO Checklist:</p>
                  {Object.entries(article.seoData.checks).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {value ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                  
                  <Button className="w-full mt-4" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize with AI
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
