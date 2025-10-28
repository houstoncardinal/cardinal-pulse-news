import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Loader2, CheckCircle, XCircle } from "lucide-react";

export const YahooFinanceImporter = () => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [category, setCategory] = useState("finance");
  const [limit, setLimit] = useState(10);
  const [lastImportResult, setLastImportResult] = useState<{
    success: boolean;
    imported: number;
    total: number;
  } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastRegenerationResult, setLastRegenerationResult] = useState<{
    success: boolean;
    regenerated: number;
    failed: number;
    total: number;
  } | null>(null);

  const categories = [
    { value: "finance", label: "General Finance" },
    { value: "stocks", label: "Stock Market" },
    { value: "crypto", label: "Cryptocurrency" },
    { value: "economy", label: "Economy" },
    { value: "earnings", label: "Earnings Reports" },
  ];

  const handleImport = async () => {
    setIsImporting(true);
    setLastImportResult(null);

    try {
      console.log('Invoking Yahoo Finance import with:', { category, limit });

      const { data, error } = await supabase.functions.invoke('import-yahoo-finance', {
        body: {
          category,
          limit,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Import result:', data);

      if (data.success) {
        setLastImportResult({
          success: true,
          imported: data.imported,
          total: data.total,
        });

        toast({
          title: "Import Successful!",
          description: `Imported ${data.imported} out of ${data.total} articles. Check the Review Queue to approve them.`,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing from Yahoo Finance:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import articles from Yahoo Finance",
        variant: "destructive",
      });
      setLastImportResult({
        success: false,
        imported: 0,
        total: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setLastRegenerationResult(null);

    try {
      console.log('Regenerating existing Yahoo Finance articles...');

      const { data, error } = await supabase.functions.invoke('regenerate-yahoo-articles', {
        body: {},
      });

      if (error) {
        throw error;
      }

      console.log('Regeneration result:', data);

      if (data.success) {
        setLastRegenerationResult({
          success: true,
          regenerated: data.regenerated,
          failed: data.failed,
          total: data.total,
        });

        toast({
          title: "Regeneration Complete!",
          description: `Regenerated ${data.regenerated} articles with AI-powered content. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
        });
      } else {
        throw new Error(data.error || 'Regeneration failed');
      }
    } catch (error) {
      console.error('Error regenerating articles:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate articles",
        variant: "destructive",
      });
      setLastRegenerationResult({
        success: false,
        regenerated: 0,
        failed: 0,
        total: 0,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-500/10 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-500" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              Yahoo Finance Importer
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live Feed
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Import Harvard-level financial news from Yahoo Finance. All articles are E-E-A-T compliant and saved as drafts for your review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">News Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Articles to Import</Label>
              <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val))}>
                <SelectTrigger id="limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Articles</SelectItem>
                  <SelectItem value="10">10 Articles</SelectItem>
                  <SelectItem value="15">15 Articles</SelectItem>
                  <SelectItem value="20">20 Articles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Quality Assurance Process
            </p>
            <p className="text-xs text-muted-foreground">
              All imported articles are saved as drafts for your review. Check the Review Queue tab to approve and publish in batches.
            </p>
          </div>

          {lastImportResult && (
            <div className={`p-4 rounded-lg border ${
              lastImportResult.success 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {lastImportResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {lastImportResult.success 
                    ? `Successfully imported ${lastImportResult.imported} of ${lastImportResult.total} articles`
                    : 'Import failed'}
                </span>
              </div>
            </div>
          )}

          {lastRegenerationResult && (
            <div className={`p-4 rounded-lg border ${
              lastRegenerationResult.success 
                ? 'bg-blue-500/5 border-blue-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {lastRegenerationResult.success ? (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {lastRegenerationResult.success 
                    ? `Regenerated ${lastRegenerationResult.regenerated} of ${lastRegenerationResult.total} articles${lastRegenerationResult.failed > 0 ? ` (${lastRegenerationResult.failed} failed)` : ''}`
                    : 'Regeneration failed'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleImport}
              disabled={isImporting || isRegenerating}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing from Yahoo Finance...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Import Yahoo Finance News
                </>
              )}
            </Button>

            <Button
              onClick={handleRegenerate}
              disabled={isImporting || isRegenerating}
              variant="outline"
              className="w-full border-blue-500/30 hover:bg-blue-500/10"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating Articles...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Regenerate Existing Articles with AI
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <p><strong>Harvard-Level Quality:</strong> All articles written with sophisticated analysis and expert perspectives</p>
            <p><strong>E-E-A-T Compliant:</strong> Meets Google's Experience, Expertise, Authoritativeness, Trustworthiness standards</p>
            <p><strong>100% Unique:</strong> Original content with proprietary analysis (1200-1800 words)</p>
            <p><strong>Google News Optimized:</strong> Structured for maximum visibility and featured snippets</p>
            <p>• Duplicate articles are automatically skipped</p>
            <p>• Source attribution to Yahoo Finance is maintained</p>
            <p>• All articles saved as drafts for review before publishing</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
