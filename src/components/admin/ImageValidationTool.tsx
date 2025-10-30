import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export const ImageValidationTool = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const scanAllArticles = async () => {
    setIsScanning(true);
    setResults([]);

    try {
      // Fetch all published articles
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, category, content, featured_image, image_url, image_credit')
        .eq('status', 'published')
        .not('featured_image', 'is', null)
        .limit(100);

      if (error) throw error;

      if (!articles || articles.length === 0) {
        toast({
          title: "No articles found",
          description: "No published articles with images to validate.",
        });
        setIsScanning(false);
        return;
      }

      toast({
        title: "Scanning articles",
        description: `Validating images for ${articles.length} articles...`,
      });

      const validationResults = [];

      // Validate each article (batch process)
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        try {
          const { data, error: validationError } = await supabase.functions.invoke('validate-article-image', {
            body: {
              articleTitle: article.title,
              imageCredit: article.image_credit,
              imageUrl: article.featured_image || article.image_url,
              articleContent: article.content?.substring(0, 1000)
            }
          });

          if (validationError) {
            console.error(`Validation error for ${article.title}:`, validationError);
            validationResults.push({
              article,
              status: 'error',
              message: validationError.message
            });
          } else {
            validationResults.push({
              article,
              status: data.valid ? 'valid' : 'invalid',
              confidence: data.confidence || 0,
              reason: data.reason || 'Unknown',
              recommendation: data.recommendation || 'review'
            });
          }

          // Update progress
          if (i % 10 === 0) {
            toast({
              title: "Scanning...",
              description: `Validated ${i + 1} of ${articles.length} articles`,
            });
          }

        } catch (err) {
          console.error(`Error validating article ${article.title}:`, err);
          validationResults.push({
            article,
            status: 'error',
            message: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults(validationResults);

      const invalidCount = validationResults.filter(r => r.status === 'invalid').length;
      const errorCount = validationResults.filter(r => r.status === 'error').length;

      toast({
        title: "Scan complete",
        description: `Found ${invalidCount} mismatched images and ${errorCount} errors.`,
        variant: invalidCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Error scanning articles:', error);
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Failed to scan articles",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, confidence?: number) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-500">✓ Valid {confidence ? `(${confidence}%)` : ''}</Badge>;
      case 'invalid':
        return <Badge variant="destructive">✗ Mismatch {confidence ? `(${confidence}%)` : ''}</Badge>;
      case 'error':
        return <Badge variant="secondary">⚠ Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className="luxury-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Image Validation Scanner</CardTitle>
            <CardDescription>
              Detect brand mismatches and inappropriate images
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={scanAllArticles}
            disabled={isScanning}
            className="bg-gradient-to-r from-primary to-red-500"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Scan All Articles
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4 mt-6">
            <div className="flex gap-4 text-sm">
              <span className="text-green-500">
                ✓ Valid: {results.filter(r => r.status === 'valid').length}
              </span>
              <span className="text-red-500">
                ✗ Invalid: {results.filter(r => r.status === 'invalid').length}
              </span>
              <span className="text-yellow-500">
                ⚠ Errors: {results.filter(r => r.status === 'error').length}
              </span>
            </div>

            {/* Show problematic articles first */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results
                .filter(r => r.status === 'invalid' || r.status === 'error')
                .map((result, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{result.article.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.article.slug}
                          </p>
                          {result.reason && (
                            <p className="text-xs mt-2 text-red-400">
                              <strong>Issue:</strong> {result.reason}
                            </p>
                          )}
                          {result.article.image_credit && (
                            <p className="text-xs mt-1 text-muted-foreground">
                              <strong>Image:</strong> {result.article.image_credit}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(result.status, result.confidence)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
