import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, Loader2 } from "lucide-react";

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email,
        is_verified: false
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        toast({
          title: "Already subscribed",
          description: "This email is already on our list!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to subscribe. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setEmail("");
      toast({
        title: "Success! 🎉",
        description: "You're now subscribed to breaking news alerts",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative p-6 rounded-lg bg-gradient-to-br from-red-950/50 via-black to-zinc-900 border border-red-600/30 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(220,38,38,.05) 35px, rgba(220,38,38,.05) 70px)'
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Breaking News Alerts
              <Sparkles className="h-4 w-4 text-red-400 animate-pulse" />
            </h3>
            <p className="text-sm text-red-200/60">Join 10,000+ readers staying informed</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-black/50 border-red-600/30 text-white placeholder:text-red-200/40"
            required
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-500/30"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>

        <p className="text-xs text-red-200/40 mt-2">
          Daily news • Weekly digest • Breaking alerts • Unsubscribe anytime
        </p>
      </div>
    </div>
  );
};
