import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Sparkles, Brain, Scale, FileSearch, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'unverified' | 'misleading';
  explanation: string;
  confidence: number;
}

interface Verification {
  id: string;
  article_id: string;
  verified_at: string;
  accuracy_score: number;
  verification_status: 'verified' | 'flagged' | 'needs_review' | 'rejected';
  fact_check_results: FactCheckResult[];
  source_credibility: {
    overall_rating: number;
    sources_evaluated: string[];
    missing_sources: string[];
    red_flags: string[];
  };
  legal_risk_assessment: string;
  recommendations: string[];
}

export const HectorFactChecker = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch published articles
  const { data: articles } = useQuery({
    queryKey: ['articles-for-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch verifications
  const { data: verifications } = useQuery({
    queryKey: ['article-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_verifications')
        .select('*')
        .order('verified_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Verification[];
    },
  });

  // Verify article mutation
  const verifyMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-article-accuracy', {
        body: { articleId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-verifications'] });
      toast.success("🤖 Hector completed the analysis!");
      setIsAnalyzing(false);
      setSelectedArticleId(null);
    },
    onError: (error) => {
      console.error('Verification failed:', error);
      toast.error("Verification failed");
      setIsAnalyzing(false);
    },
  });

  const handleVerify = async (articleId: string) => {
    setSelectedArticleId(articleId);
    setIsAnalyzing(true);
    toast.info("🤖 Hector is analyzing the article...");
    verifyMutation.mutate(articleId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'flagged':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'needs_review':
        return <FileSearch className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'false':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'misleading':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'unverified':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hector Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 p-8 border border-primary/20"
      >
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative flex items-center gap-6">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            className="p-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500"
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Hector AI - Fact Checker
            </h1>
            <p className="text-muted-foreground text-lg">
              Your virtual compliance officer ensuring accuracy & legal protection
            </p>
          </div>

          <div className="flex gap-4">
            <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Articles Verified</div>
              <div className="text-3xl font-bold text-primary">{verifications?.length || 0}</div>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Accuracy Avg</div>
              <div className="text-3xl font-bold text-green-500">
                {verifications?.length 
                  ? Math.round(verifications.reduce((acc, v) => acc + v.accuracy_score, 0) / verifications.length)
                  : 0}%
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles Queue */}
        <Card className="p-6 bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Article Queue</h2>
          </div>
          
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              <AnimatePresence>
                {articles?.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:bg-accent/50 transition-all border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">{article.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            <span>•</span>
                            <span>{new Date(article.published_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleVerify(article.id)}
                          disabled={isAnalyzing && selectedArticleId === article.id}
                          className="shrink-0 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                        >
                          {isAnalyzing && selectedArticleId === article.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Card>

        {/* Verification Results */}
        <Card className="p-6 bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Recent Verifications</h2>
          </div>
          
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {verifications?.map((verification) => {
                const article = articles?.find(a => a.id === verification.article_id);
                
                return (
                  <motion.div
                    key={verification.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="p-4 border-border/50 bg-card/80">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(verification.verification_status)}
                          <Badge className="capitalize">{verification.verification_status}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{verification.accuracy_score}%</div>
                          <div className="text-xs text-muted-foreground">Accuracy</div>
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm mb-3 line-clamp-2">{article?.title}</h4>

                      {/* Legal Risk */}
                      <div className="mb-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Legal Risk:</span>
                          <span className={`text-sm font-bold ${getRiskColor(verification.legal_risk_assessment)}`}>
                            {verification.legal_risk_assessment}
                          </span>
                        </div>
                      </div>

                      {/* Fact Check Results */}
                      {verification.fact_check_results.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="text-xs font-semibold text-muted-foreground">Fact Checks:</div>
                          {verification.fact_check_results.slice(0, 2).map((fact, idx) => (
                            <div key={idx} className="text-xs p-2 rounded bg-muted/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-xs ${getVerdictColor(fact.verdict)}`}>
                                  {fact.verdict}
                                </Badge>
                                <span className="text-muted-foreground">{fact.confidence}%</span>
                              </div>
                              <p className="line-clamp-2">{fact.claim}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Source Credibility */}
                      {verification.source_credibility && (
                        <div className="p-2 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-1">Source Credibility</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-cyan-500"
                                style={{ width: `${verification.source_credibility.overall_rating}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{verification.source_credibility.overall_rating}%</span>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {verification.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Recommendations:</div>
                          <ul className="space-y-1">
                            {verification.recommendations.slice(0, 2).map((rec, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span className="line-clamp-2">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
