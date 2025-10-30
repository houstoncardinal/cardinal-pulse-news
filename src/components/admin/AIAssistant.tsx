import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, Sparkles, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="text-sm text-destructive">{result.error}</div>
        </div>
      );
    }
    
    if (result.checks) {
      return (
        <div className="space-y-2">
          {result.checks.map((check: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">{check.message}</div>
                {check.items && (
                  <div className="mt-1 text-xs text-muted-foreground">
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <div className="text-sm text-green-500">Operation completed successfully</div>
        </div>
      );
    }
    
    return (
      <div className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col bg-gradient-to-br from-background to-muted/20 border-primary/20">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-purple-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Your intelligent platform manager</p>
          </div>
          <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
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
                <div className="p-2 bg-primary/10 rounded-full h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3"
                  : "bg-muted rounded-2xl rounded-tl-sm p-3"
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
                <div className="p-2 bg-primary/10 rounded-full h-fit">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 rounded-full h-fit">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
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
            placeholder="Ask me anything about the platform..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};
