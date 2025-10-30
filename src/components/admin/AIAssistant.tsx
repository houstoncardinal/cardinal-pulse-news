import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, Sparkles, AlertTriangle, CheckCircle2, XCircle, Minimize2, Maximize2, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  toolResults?: any[];
}

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm your AI Assistant for Cardinal News. I can help you:\n\n• Navigate and manage the platform\n• Create, edit, or delete articles\n• Query and analyze your database\n• Check for security issues\n• Monitor system performance\n\nWhat would you like to do?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-assistant`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let toolResults: any[] = [];

      const processStream = async () => {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;
            
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle tool results
              if (parsed.type === "tool_result") {
                toolResults.push(JSON.parse(parsed.result));
              }
              
              // Handle content deltas
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  
                  if (lastMsg?.role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      content: assistantMessage,
                      toolResults: toolResults.length > 0 ? toolResults : undefined
                    };
                  } else {
                    newMessages.push({
                      role: "assistant",
                      content: assistantMessage,
                      toolResults: toolResults.length > 0 ? toolResults : undefined
                    });
                  }
                  
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      };

      await processStream();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolResult = (result: any) => {
    if (result.error) {
      return (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-600/30">
          <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
          <div className="text-sm text-red-300">{result.error}</div>
        </div>
      );
    }
    
    if (result.checks) {
      return (
        <div className="space-y-2">
          {result.checks.map((check: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/50 border border-amber-600/30">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-300">{check.message}</div>
                {check.items && (
                  <div className="mt-1 text-xs text-amber-200/60">
                    {check.items.slice(0, 3).map((item: any) => (
                      <div key={item.id}>{item.title}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (result.success) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/50 border border-emerald-600/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <div className="text-sm text-emerald-300">Operation completed successfully</div>
        </div>
      );
    }
    
    return (
      <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs font-mono overflow-x-auto text-red-200/80">
        {JSON.stringify(result, null, 2)}
      </div>
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
            
            {/* Button */}
            <div className="relative flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-red-600 to-red-700 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] transition-all duration-300 border border-red-500/30">
              <Bot className="h-6 w-6 text-white" />
              <span className="font-bold text-white">AI Assistant</span>
              <Sparkles className="h-4 w-4 text-red-200 animate-pulse" />
            </div>
            
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />
          </button>
          
          {/* Powered by AI badge */}
          <div className="absolute -top-2 -right-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded-full border border-red-500/50 shadow-lg">
            <Zap className="h-2 w-2 inline mr-1" />
            AI
          </div>
        </div>
      )}

      {/* AI Assistant Widget */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 transition-all duration-300 animate-fade-in",
          isMinimized 
            ? "bottom-8 right-8 w-80" 
            : "bottom-8 right-8 w-[480px] h-[600px]"
        )}>
          <Card className="h-full flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black border-red-600/30 shadow-[0_0_80px_rgba(220,38,38,0.3)] overflow-hidden">
            {/* Luxury background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
              }} />
            </div>
            
            {/* Red glow line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
            
            {/* Header */}
            <div className="relative p-4 border-b border-red-600/20 bg-gradient-to-r from-red-950/50 to-black/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                  <Bot className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">AI Assistant</h3>
                    <div className="px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full">
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5" />
                        POWERED BY AI
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-red-200/60">Elite Intelligence System</p>
                </div>
                
                {/* Control buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 text-red-300 hover:text-white hover:bg-red-600/20"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-red-300 hover:text-white hover:bg-red-600/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <ScrollArea ref={scrollRef} className="flex-1 p-4 relative">
                  <div className="space-y-4">
                    {messages.map((message, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3 animate-fade-in",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="relative p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-full h-fit shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            <Bot className="h-4 w-4 text-white" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                          </div>
                        )}
                        
                        <div className={cn(
                          "max-w-[75%] space-y-2",
                          message.role === "user"
                            ? "bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl rounded-tr-sm p-3 shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/30"
                            : "bg-gradient-to-br from-zinc-800 to-zinc-900 text-white rounded-2xl rounded-tl-sm p-3 border border-white/10"
                        )}>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          
                          {message.toolResults && message.toolResults.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {message.toolResults.map((result, ridx) => (
                                <div key={ridx}>{renderToolResult(result)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {message.role === "user" && (
                          <div className="p-2 bg-gradient-to-br from-white/10 to-white/5 rounded-full h-fit border border-white/20">
                            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="relative p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-full h-fit">
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        </div>
                        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl rounded-tl-sm p-3 border border-white/10">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="relative p-4 border-t border-red-600/20 bg-gradient-to-r from-red-950/30 to-black/30 backdrop-blur-xl">
                  {/* Red glow line at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask your AI assistant..."
                      disabled={isLoading}
                      className="flex-1 bg-black/50 border-red-600/30 text-white placeholder:text-red-200/40 focus:border-red-500 focus:ring-red-500/20"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] border border-red-500/30 transition-all duration-300"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Send className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}

            {isMinimized && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-200/60">Click to expand</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};
