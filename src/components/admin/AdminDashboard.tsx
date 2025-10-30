import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EnhancedTrendsPanel } from "./EnhancedTrendsPanel";
import { ArticlesPanel } from "./ArticlesPanel";
import { ArticleManagement } from "./ArticleManagement";
import { ArticleReviewPanel } from "./ArticleReviewPanel";
import { JobsLog } from "./JobsLog";
import { SettingsPanel } from "./SettingsPanel";
import { QuickCreate } from "./QuickCreate";
import { TrendingBatchGenerator } from "./TrendingBatchGenerator";
import { ManualTrendsRefresh } from "./ManualTrendsRefresh";
import { BulkArticleGenerator } from "./BulkArticleGenerator";
import { GenerateDiverseArticles } from "./GenerateDiverseArticles";
import { GenerateGlobalStories } from "./GenerateGlobalStories";
import { CategoryArticleGenerator } from "./CategoryArticleGenerator";
import { YahooFinanceImporter } from "./YahooFinanceImporter";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { BatchOperations } from "./BatchOperations";
import { RegenerateImages } from "./RegenerateImages";
import { CleanupArticles } from "./CleanupArticles";
import { FixDuplicateImages } from "./FixDuplicateImages";
import { SystemMonitor } from "./SystemMonitor";
import { ContentCalendar } from "./ContentCalendar";
import { SEOOptimizer } from "./SEOOptimizer";
import { RealtimeMetrics } from "./RealtimeMetrics";
import { ContentWorkflow } from "./ContentWorkflow";
import { TrendingCoverage } from "./TrendingCoverage";
import { WipeArticles } from "./WipeArticles";
import { AIAssistant } from "./AIAssistant";
import { TrendingUp, FileText, Clock, Settings, MoreHorizontal, Sparkles, Zap, BarChart3, Bell, Users, Globe, Activity, Calendar, Search, Radio, GitBranch, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("trends");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  const mainTabs = [
    { value: "trends", label: "Trends", icon: TrendingUp, mobileLabel: "Trends" },
    { value: "review", label: "Review Queue", icon: Clock, mobileLabel: "Review" },
    { value: "articles", label: "Articles", icon: FileText, mobileLabel: "Articles" },
    { value: "jobs", label: "Jobs", icon: Clock, mobileLabel: "Jobs" },
  ];

  const moreMenuItems = [
    { value: "coverage", label: "Trending Coverage", icon: Target, description: "Fill gaps in trending categories" },
    { value: "calendar", label: "Content Calendar", icon: Calendar, description: "Plan and schedule content" },
    { value: "seo", label: "SEO Optimizer", icon: Search, description: "Optimize article SEO" },
    { value: "realtime", label: "Live Metrics", icon: Radio, description: "Real-time performance" },
    { value: "workflow", label: "Workflow", icon: GitBranch, description: "Manage content pipeline" },
    { value: "analytics", label: "Analytics", icon: BarChart3, description: "View performance metrics" },
    { value: "batch", label: "Batch Operations", icon: Zap, description: "Bulk article management" },
    { value: "monitor", label: "System Monitor", icon: Activity, description: "Track system health" },
    { value: "settings", label: "Settings", icon: Settings, description: "Configure your newsroom" },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8 overflow-x-hidden">
      {/* Header - Responsive */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-8 max-w-full">
        <div className="mb-6 md:mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-red-400/20 blur-3xl opacity-30 -z-10" />
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                Admin Control Center
              </h1>
              <p className="text-xs md:text-sm text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                AI Newsroom • Real-time • Powered by Trends
              </p>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="mb-6">
          <AIAssistant />
        </div>

        {/* Quick Actions - Responsive */}
        <div className="space-y-3 md:space-y-4 max-w-full overflow-hidden">
          <WipeArticles />
          <TrendingBatchGenerator />
          <QuickCreate />
          <GenerateGlobalStories />
          <YahooFinanceImporter />
          <ManualTrendsRefresh />
          <GenerateDiverseArticles />
          <BulkArticleGenerator />
        </div>
      </div>
      
      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="container mx-auto px-4 md:px-6 lg:px-8 mt-6 max-w-full overflow-hidden">
        <TabsList className="hidden md:grid w-full grid-cols-5 h-12">
          {[...mainTabs, { value: "settings", label: "Settings", icon: Settings, mobileLabel: "Settings" }].map((tab) => (
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
          <div className="space-y-6">
            <CategoryArticleGenerator />
            <EnhancedTrendsPanel />
          </div>
        </TabsContent>
        
        <TabsContent value="review" className="mt-6">
          <ArticleReviewPanel />
        </TabsContent>
        
        <TabsContent value="articles" className="mt-6">
          <ArticleManagement />
        </TabsContent>
        
        <TabsContent value="jobs" className="mt-6">
          <JobsLog />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar />
        </TabsContent>
        
        <TabsContent value="seo" className="mt-6">
          <SEOOptimizer />
        </TabsContent>
        
        <TabsContent value="realtime" className="mt-6">
          <RealtimeMetrics />
        </TabsContent>
        
        <TabsContent value="workflow" className="mt-6">
          <ContentWorkflow />
        </TabsContent>
        
        <TabsContent value="coverage" className="mt-6">
          <TrendingCoverage />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="batch" className="mt-6">
          <div className="space-y-6">
            <FixDuplicateImages />
            <CleanupArticles />
            <RegenerateImages />
            <BatchOperations />
          </div>
        </TabsContent>
        
        <TabsContent value="monitor" className="mt-6">
          <SystemMonitor />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Navigation - Ultra Luxury Glassmorphism */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Gradient overlay for elevation effect */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
        
        <nav className="relative mx-3 mb-3 rounded-3xl bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] pointer-events-auto overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-red-400/10 opacity-50" />
          
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          
          <div className="relative flex items-center justify-around h-20 px-2">
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-300 relative group",
                    "active:scale-90"
                  )}
                >
                  {/* Active glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                  )}
                  
                  <div className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_4px_16px_rgba(var(--primary),0.4)] scale-110" 
                      : "text-muted-foreground group-hover:bg-white/10 group-hover:scale-105"
                  )}>
                    <tab.icon className={cn(
                      "transition-all duration-300",
                      isActive ? "h-6 w-6" : "h-5 w-5"
                    )} />
                    
                    {/* Shine effect */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-[10px] font-semibold transition-all duration-300 tracking-wide",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                      : "text-muted-foreground"
                  )}>
                    {tab.mobileLabel}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                </button>
              );
            })}
            
            {/* More Menu Button with Enhanced Styling */}
            <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-300 relative group active:scale-90">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-primary/10 text-foreground group-hover:scale-105 border border-white/10">
                    <MoreHorizontal className="h-5 w-5" />
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-pulse" />
                  </div>
                  
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">
                    More
                  </span>
                </button>
              </SheetTrigger>
              
              <SheetContent 
                side="bottom" 
                className="h-[85vh] rounded-t-[2rem] border-t-2 border-white/20 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-red-400/5 opacity-50" />
                
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                
                <div className="relative h-full flex flex-col">
                  {/* Elegant drag handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)]" />
                  </div>
                  
                  <SheetHeader className="px-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                          Quick Menu
                        </SheetTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Explore advanced features
                        </p>
                      </div>
                    </div>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {moreMenuItems.map((item, index) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setActiveTab(item.value);
                          setMoreMenuOpen(false);
                        }}
                        className={cn(
                          "w-full group relative overflow-hidden rounded-2xl transition-all duration-300",
                          "bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-xl",
                          "border border-white/10 hover:border-primary/30",
                          "p-5 hover:scale-[1.02] active:scale-[0.98]",
                          "shadow-lg hover:shadow-[0_8px_24px_rgba(var(--primary),0.15)]",
                          activeTab === item.value && "border-primary/50 bg-primary/5"
                        )}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: "fade-in 0.3s ease-out forwards"
                        }}
                      >
                        {/* Hover gradient effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl transition-all duration-300",
                            "bg-gradient-to-br from-primary/10 to-purple-500/10",
                            "group-hover:scale-110 group-hover:shadow-[0_4px_16px_rgba(var(--primary),0.3)]",
                            activeTab === item.value && "bg-gradient-to-br from-primary/20 to-purple-500/20"
                          )}>
                            <item.icon className={cn(
                              "h-6 w-6 transition-colors duration-300",
                              activeTab === item.value ? "text-primary" : "text-foreground"
                            )} />
                          </div>
                          
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-base text-foreground flex items-center gap-2">
                              {item.label}
                              {activeTab === item.value && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </div>
                          </div>
                          
                          <div className="text-primary/40 group-hover:text-primary transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Elegant footer */}
                  <div className="p-6 border-t border-white/10 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-xl">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      <span>Powered by Cardinal AI</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </div>
  );
};
