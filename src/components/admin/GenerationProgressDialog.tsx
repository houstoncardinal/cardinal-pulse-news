import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  details?: string;
}

interface GenerationProgressDialogProps {
  open: boolean;
  title: string;
  description: string;
  steps: GenerationStep[];
  onClose?: () => void;
}

export const GenerationProgressDialog = ({
  open,
  title,
  description,
  steps,
  onClose
}: GenerationProgressDialogProps) => {
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const hasError = steps.some(s => s.status === 'error');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedSteps} / {totalSteps} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
                  step.status === 'complete' && "bg-green-500/10 border-green-500/20",
                  step.status === 'loading' && "bg-primary/10 border-primary/20 animate-pulse",
                  step.status === 'error' && "bg-destructive/10 border-destructive/20",
                  step.status === 'pending' && "bg-muted/50 border-muted"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'complete' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {step.status === 'loading' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {step.status === 'error' && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  {step.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <p className="font-medium text-sm mt-1">{step.label}</p>
                  {step.details && (
                    <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Message */}
          {hasError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">
                Some steps encountered errors. Check the details above.
              </p>
            </div>
          )}

          {completedSteps === totalSteps && !hasError && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                All articles generated successfully! Page will reload shortly.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
