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
  const [autoPublish, setAutoPublish] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<{
    success: boolean;
    imported: number;
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
      console.log('Invoking Yahoo Finance import with:', { category, limit, autoPublish });

      const { data, error } = await supabase.functions.invoke('import-yahoo-finance', {
        body: {
          category,
          limit,
          autoPublish,
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
          description: `Imported ${data.imported} out of ${data.total} articles from Yahoo Finance.`,
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
              Import the latest financial news from Yahoo Finance. Articles can be customized and edited after import.
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

          <div className="flex items-center space-x-2 p-3 bg-background/50 rounded-lg border border-border/50">
            <Switch
              id="auto-publish"
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
            />
            <Label htmlFor="auto-publish" className="cursor-pointer flex-1">
              <span className="font-medium">Auto-publish imported articles</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Articles will be published immediately. Otherwise saved as drafts.
              </p>
            </Label>
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

          <Button
            onClick={handleImport}
            disabled={isImporting}
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

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <p>• Articles are fetched from Yahoo Finance RSS feeds</p>
            <p>• Duplicate articles are automatically skipped</p>
            <p>• You can edit and customize articles after import</p>
            <p>• Source attribution is automatically added to each article</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
