import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { formatDistanceToNow } from "date-fns";

export const JobsLog = () => {
  const { data: jobs, isLoading } = useJobs(30);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Job History</h2>
      
      <Card className="p-4">
        <div className="space-y-3">
          {jobs?.map((job) => (
            <div key={job.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
              <div className="mt-1">{getStatusIcon(job.status)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{job.type.replace(/_/g, ' ')}</span>
                  <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </p>
                
                {job.error_message && (
                  <p className="text-sm text-red-500 mt-1">{job.error_message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
