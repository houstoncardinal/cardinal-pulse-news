import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { CommunityLeaderboard } from "@/components/community/CommunityLeaderboard";
import { NewsletterSignup } from "@/components/community/NewsletterSignup";
import { Users, TrendingUp, Award, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Community | Cardinal News - Join Our Readers</title>
        <meta name="description" content="Join the Cardinal News community. Engage with thousands of readers, share your thoughts, and earn rewards." />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/30 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-red-400 animate-pulse" />
            <span className="text-sm font-semibold text-red-400">10,000+ Active Members</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Join Our <span className="text-gradient bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Community</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with readers worldwide, share your insights, and stay informed with breaking news.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
            <div className="p-3 bg-red-600/20 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Engage & Discuss</h3>
            <p className="text-muted-foreground">
              Comment on articles, reply to others, and build meaningful conversations with readers worldwide.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
            <div className="p-3 bg-red-600/20 rounded-lg w-fit mb-4">
              <TrendingUp className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Earn Reputation</h3>
            <p className="text-muted-foreground">
              Gain points for comments, shares, and quality contributions. Climb the leaderboard and earn badges.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border/50">
            <div className="p-3 bg-red-600/20 rounded-lg w-fit mb-4">
              <Award className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Unlock Rewards</h3>
            <p className="text-muted-foreground">
              Top contributors get exclusive access to breaking news alerts, premium content, and special badges.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold mb-1">Read & Comment</h4>
                    <p className="text-sm text-muted-foreground">Share your thoughts on articles. Each comment earns you +5 reputation points.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold mb-1">Share & Spread</h4>
                    <p className="text-sm text-muted-foreground">Share articles on social media. Each share earns you +3 reputation points.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold mb-1">Get Liked</h4>
                    <p className="text-sm text-muted-foreground">When others like your comments, you earn +2 reputation points per like.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-bold flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-bold mb-1">Climb the Ranks</h4>
                    <p className="text-sm text-muted-foreground">Top contributors get featured on the leaderboard and earn exclusive badges.</p>
                  </div>
                </div>
              </div>
            </div>

            <NewsletterSignup />
          </div>

          <div className="space-y-6">
            <CommunityLeaderboard />
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileToolbar />
    </div>
  );
};

export default Community;
