import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendsPanel } from "./TrendsPanel";
import { ArticlesPanel } from "./ArticlesPanel";
import { JobsLog } from "./JobsLog";
import { SettingsPanel } from "./SettingsPanel";
import { QuickCreate } from "./QuickCreate";

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
          Cardinal News - AI Newsroom
        </h1>
        <p className="text-muted-foreground">Autonomous AI newsroom • Real-time updates • Powered by trends</p>
      </div>

      <QuickCreate />
      
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Live Trends</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <TrendsPanel />
        </TabsContent>
        
        <TabsContent value="articles">
          <ArticlesPanel />
        </TabsContent>
        
        <TabsContent value="jobs">
          <JobsLog />
        </TabsContent>
        
        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
