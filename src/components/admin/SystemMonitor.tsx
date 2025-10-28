import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/hooks/useJobs";
import { Activity, AlertCircle, CheckCircle2, Clock, Server, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";

export const SystemMonitor = () => {
  const { data: jobs } = useJobs();

  const recentJobs = jobs?.slice(0, 10) || [];
  const successRate = jobs?.length 
    ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100 
    : 0;

  const jobsByType = jobs?.reduce((acc, job) => {
    acc[job.type] = (acc[job.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const errorJobs = jobs?.filter(j => j.status === 'failed') || [];
  const runningJobs = jobs?.filter(j => j.status === 'running') || [];
  const completedJobs = jobs?.filter(j => j.status === 'completed') || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">System Monitor</h2>
          <p className="text-muted-foreground">Real-time system health & job tracking</p>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs.length}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground">Total successful jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorJobs.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Job Types Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobsByType && Object.entries(jobsByType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{type}</span>
                  <span className="text-muted-foreground">{count} jobs</span>
                </div>
                <Progress value={(count / (jobs?.length || 1)) * 100} />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Recent Jobs Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">
                  {getStatusIcon(job.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{job.type}</span>
                    <Badge variant={getStatusVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </div>

                  {job.error_message && (
                    <p className="text-sm text-red-500 mb-1">{job.error_message}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                    
                    {job.completed_at && job.started_at && (
                      <span>
                        Duration: {Math.round(
                          (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000
                        )}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      {errorJobs.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-red-900">{job.type}</span>
                    <span className="text-xs text-red-600">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{job.error_message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};