import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTrendsPanel } from "./EnhancedTrendsPanel";
import { ArticlesPanel } from "./ArticlesPanel";
import { JobsLog } from "./JobsLog";
import { SettingsPanel } from "./SettingsPanel";
import { QuickCreate } from "./QuickCreate";
import { ManualTrendsRefresh } from "./ManualTrendsRefresh";
import { TrendingUp, FileText, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("trends");
  
  const tabs = [
    { value: "trends", label: "Trends", icon: TrendingUp, mobileLabel: "Trends" },
    { value: "articles", label: "Articles", icon: FileText, mobileLabel: "Articles" },
    { value: "jobs", label: "Jobs", icon: Clock, mobileLabel: "Jobs" },
    { value: "settings", label: "Settings", icon: Settings, mobileLabel: "Settings" },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header - Responsive */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
            Cardinal News
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            AI Newsroom • Real-time • Powered by Trends
          </p>
        </div>

        {/* Quick Actions - Responsive */}
        <div className="space-y-3 md:space-y-4">
          <QuickCreate />
          <ManualTrendsRefresh />
        </div>
      </div>
      
      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="container mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <TabsList className="hidden md:grid w-full grid-cols-4 h-12">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="text-sm font-medium"
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="trends" className="mt-6">
          <EnhancedTrendsPanel />
        </TabsContent>
        
        <TabsContent value="articles" className="mt-6">
          <ArticlesPanel />
        </TabsContent>
        
        <TabsContent value="jobs" className="mt-6">
          <JobsLog />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Navigation - Luxury Experience */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl">
        <nav className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative",
                  "active:scale-95"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                  <tab.icon className={cn(
                    "transition-all duration-300",
                    isActive ? "h-5 w-5" : "h-5 w-5"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground"
                )}>
                  {tab.mobileLabel}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
