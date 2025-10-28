import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Music, Film, Beaker, Scale, Cpu } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { id: 'music', name: 'Music', icon: Music, color: 'text-purple-500' },
  { id: 'movies', name: 'Movies', icon: Film, color: 'text-blue-500' },
  { id: 'science', name: 'Science', icon: Beaker, color: 'text-green-500' },
  { id: 'politics', name: 'Politics', icon: Scale, color: 'text-red-500' },
  { id: 'ai_innovation', name: 'AI & Innovation', icon: Cpu, color: 'text-cyan-500' }
];

export const CategoryArticleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.map(c => c.id)
  );
  const [articlesPerCategory, setArticlesPerCategory] = useState(3);
  const [results, setResults] = useState<any>(null);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const generateArticles = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setIsGenerating(true);
    setResults(null);

    try {
      toast.info(`Generating ${articlesPerCategory} articles for ${selectedCategories.length} categories...`);

      const { data, error } = await supabase.functions.invoke('generate-category-articles', {
        body: {
          categories: selectedCategories,
          articlesPerCategory
        }
      });

      if (error) throw error;

      setResults(data);
      toast.success(data.message);

      // Refresh after short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error generating articles:', error);
      toast.error(error.message || 'Failed to generate articles');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Trending Category Articles
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create high-quality articles in Music, Movies, Science, Politics & AI Innovation
          </p>
        </div>

        <div className="space-y-3">
          <Label>Select Categories</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Icon className={`h-5 w-5 ${category.color}`} />
                  <Label
                    htmlFor={category.id}
                    className="flex-1 cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articles-count">Articles per Category</Label>
          <Input
            id="articles-count"
            type="number"
            min="1"
            max="5"
            value={articlesPerCategory}
            onChange={(e) => setArticlesPerCategory(parseInt(e.target.value) || 1)}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Total: {articlesPerCategory * selectedCategories.length} articles
          </p>
        </div>

        <Button
          onClick={generateArticles}
          disabled={isGenerating || selectedCategories.length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Articles...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate {articlesPerCategory * selectedCategories.length} Articles Now
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Generation Complete
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <strong className="text-primary">{results.totalArticles}</strong> articles generated
              </p>
              <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                {results.results?.map((result: any, idx: number) => {
                  const category = CATEGORIES.find(c => c.id === result.category);
                  const Icon = category?.icon || Sparkles;
                  return (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-background/50 rounded">
                      <Icon className={`h-4 w-4 mt-0.5 ${category?.color || ''}`} />
                      <div className="flex-1 min-w-0">
                        <span className={result.status === 'generated' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                          {result.status === 'generated' ? '✓' : '○'}
                        </span>
                        <span className="ml-2 text-muted-foreground truncate">
                          {result.title || result.trend}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
