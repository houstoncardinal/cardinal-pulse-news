import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const AutoFixImages = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const runAutoFix = async () => {
      // Check if we've already run this session
      const hasRun = sessionStorage.getItem('images-auto-fixed');
      if (hasRun) return;

      setStatus('running');
      setProgress("Automatically scanning and fixing all article images...");

      try {
        const { data, error } = await supabase.functions.invoke('fix-duplicate-and-missing-images');

        if (error) throw error;

        setStatus('success');
        setProgress(`✅ Complete! Updated ${data.summary.successful} articles`);
        sessionStorage.setItem('images-auto-fixed', 'true');

        toast({
          title: "Images Updated",
          description: `Successfully updated ${data.summary.successful} articles with unique images`,
        });

        if (data.details.failed.length > 0) {
          console.log('Failed articles:', data.details.failed);
        }

      } catch (error) {
        console.error('Auto-fix error:', error);
        setStatus('error');
        setProgress("❌ Auto-fix encountered an error");
      }
    };

    runAutoFix();
  }, [toast]);

  if (status === 'idle') return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          Automatic Image Updater
        </CardTitle>
        <CardDescription>
          {status === 'running' && "Replacing all fallback images with unique, credited images..."}
          {status === 'success' && "All article images have been updated successfully"}
          {status === 'error' && "There was an issue updating images"}
        </CardDescription>
      </CardHeader>
      {progress && (
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono">{progress}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
