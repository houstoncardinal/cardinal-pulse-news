import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useArticles } from "@/hooks/useArticles";
import { Helmet } from "react-helmet-async";
import { Play, Users, MessageCircle, Radio, TrendingUp, Clock, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Link } from "react-router-dom";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

export default function Watch() {
  const { data: articles } = useArticles();
  const [activeStream, setActiveStream] = useState<string>("live-news");
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [username] = useState(`Viewer${Math.floor(Math.random() * 10000)}`);

  const streams = [
    {
      id: "live-news",
      title: "24/7 Breaking News",
      thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      viewers: viewerCount,
      isLive: true,
      category: "News",
      description: "Your continuous source for breaking news from around the world"
    },
    {
      id: "weather",
      title: "Global Weather Center",
      thumbnail: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800",
      viewers: Math.floor(viewerCount * 0.6),
      isLive: true,
      category: "Weather",
      description: "Real-time weather updates and forecasts worldwide"
    },
    {
      id: "business",
      title: "Markets & Business",
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
      viewers: Math.floor(viewerCount * 0.4),
      isLive: true,
      category: "Business",
      description: "Live market updates and business news"
    },
  ];

  useEffect(() => {
    // Set up realtime presence for live viewer count
    const roomChannel = supabase.channel('watch-room', {
      config: {
        presence: {
          key: username,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
        console.log('Viewers updated:', count);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setChatMessages(prev => [...prev, payload as ChatMessage]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            username,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [username]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel) return;

    const message: ChatMessage = {
      id: Math.random().toString(36),
      user: username,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: message,
    });

    setNewMessage("");
  };

  const latestNews = articles?.slice(0, 5) || [];

  return (
    <>
      <Helmet>
        <title>Watch Live - Cardinal News 24/7 Broadcast</title>
        <meta name="description" content="Watch Cardinal News live - 24/7 breaking news coverage, real-time chat, and interactive broadcast center" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Radio className="h-10 w-10 text-red-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold">
                  Watch Live
                </h1>
                <p className="text-muted-foreground">Broadcasting 24/7 • Real-time updates</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Stream */}
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-black">
                  {/* Live Badge */}
                  <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                  
                  {/* Viewer Count */}
                  <Badge className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-sm">
                    <Eye className="h-3 w-3 mr-1" />
                    {viewerCount.toLocaleString()} watching
                  </Badge>

                  {/* Video Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Play className="h-24 w-24 text-primary mx-auto" />
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {streams.find(s => s.id === activeStream)?.title}
                        </h3>
                        <p className="text-white/80">
                          {streams.find(s => s.id === activeStream)?.description}
                        </p>
                      </div>
                      <Button size="lg" className="gap-2">
                        <Play className="h-5 w-5" />
                        Start Watching
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {streams.find(s => s.id === activeStream)?.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {viewerCount.toLocaleString()} viewers
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Live Now
                      </span>
                    </div>
                  </div>

                  {/* Stream Tabs */}
                  <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="chat">Live Chat</TabsTrigger>
                      <TabsTrigger value="news">Latest News</TabsTrigger>
                      <TabsTrigger value="related">Related</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="space-y-4">
                      <Card className="p-4">
                        <ScrollArea className="h-64 pr-4">
                          <div className="space-y-3">
                            {chatMessages.map((msg) => (
                              <div key={msg.id} className="flex items-start gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary/20">
                                    {msg.user.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm">{msg.user}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm break-words">{msg.message}</p>
                                </div>
                              </div>
                            ))}
                            {chatMessages.length === 0 && (
                              <p className="text-center text-muted-foreground py-8">
                                Be the first to chat! Say hello to other viewers.
                              </p>
                            )}
                          </div>
                        </ScrollArea>

                        <div className="flex gap-2 mt-4">
                          <Input
                            placeholder="Send a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={sendMessage} size="icon">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="news" className="space-y-3">
                      {latestNews.map((article) => (
                        <Link key={article.id} to={`/article/${article.slug}`}>
                          <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                            <div className="flex gap-3">
                              <img
                                src={article.featured_image || article.image_url}
                                alt={article.title}
                                className="w-24 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <Badge className="mb-1 text-xs">{article.category}</Badge>
                                <h4 className="font-semibold text-sm line-clamp-2">{article.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {article.read_time}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </TabsContent>

                    <TabsContent value="related">
                      <p className="text-center text-muted-foreground py-8">
                        More content coming soon
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Other Streams */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Live Streams
                </h3>
                <div className="space-y-3">
                  {streams.map((stream) => (
                    <div
                      key={stream.id}
                      className={`group cursor-pointer rounded-lg overflow-hidden transition-all ${
                        activeStream === stream.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setActiveStream(stream.id)}
                    >
                      <div className="relative">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-full h-24 object-cover"
                        />
                        {stream.isLive && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                            LIVE
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-3 bg-card">
                        <h4 className="font-semibold text-sm line-clamp-1">{stream.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3" />
                          {stream.viewers.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Active Viewers */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {viewerCount} Viewers Online
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(5, viewerCount))].map((_, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary/20">
                            V{i + 1}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {viewerCount > 5 && (
                      <span className="text-muted-foreground">
                        +{viewerCount - 5} more
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Join the conversation in live chat!
                  </p>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Today's Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Articles Published</span>
                    <span className="font-bold">{articles?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-bold">
                      {articles?.reduce((sum, a) => sum + (a.views_count || 0), 0).toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Live Streams</span>
                    <span className="font-bold">{streams.filter(s => s.isLive).length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
