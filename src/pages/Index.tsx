import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrendingTicker } from "@/components/TrendingTicker";
import { NewsCard } from "@/components/NewsCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const featuredNews = {
  title: "Artificial Intelligence Transforms Global Healthcare Systems",
  excerpt:
    "Revolutionary AI technology is reshaping how medical professionals diagnose and treat patients worldwide, marking a new era in healthcare delivery and patient outcomes.",
  category: "AI & Innovation",
  image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070",
  author: "Cardinal AI",
  readTime: "8 min read",
  views: "2.4M",
};

const newsArticles = [
  {
    title: "Global Markets Reach New Heights Amid Economic Recovery",
    excerpt:
      "Stock markets worldwide continue their upward trajectory as economic indicators signal sustained growth across major economies.",
    category: "Business",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070",
    author: "Sarah Mitchell",
    readTime: "5 min read",
    views: "1.8M",
  },
  {
    title: "Revolutionary Clean Energy Technology Unveiled",
    excerpt:
      "Scientists announce breakthrough in renewable energy storage that could transform the global power grid.",
    category: "Science",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070",
    author: "Dr. James Chen",
    readTime: "6 min read",
    views: "1.5M",
  },
  {
    title: "Championship Finals Break All-Time Viewership Records",
    excerpt:
      "Historic sporting event captivates global audience with record-breaking attendance and streaming numbers.",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070",
    author: "Marcus Rodriguez",
    readTime: "4 min read",
    views: "3.2M",
  },
  {
    title: "Tech Giants Announce Major Cybersecurity Initiative",
    excerpt:
      "Leading technology companies unite to establish new standards for digital security and privacy protection.",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070",
    author: "Emily Park",
    readTime: "7 min read",
    views: "2.1M",
  },
  {
    title: "Global Climate Summit Reaches Historic Agreement",
    excerpt:
      "World leaders commit to unprecedented environmental protections in landmark international accord.",
    category: "World",
    image: "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?q=80&w=2070",
    author: "Cardinal World",
    readTime: "9 min read",
    views: "4.5M",
  },
  {
    title: "Revolutionary Film Receives Critical Acclaim",
    excerpt:
      "New cinematic release breaks box office records while earning praise from critics worldwide.",
    category: "Entertainment",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070",
    author: "Lisa Anderson",
    readTime: "5 min read",
    views: "1.9M",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TrendingTicker />
      <Hero />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Featured Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl font-bold">Featured Stories</h2>
            <Button variant="outline">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NewsCard {...featuredNews} featured />
            {newsArticles.slice(0, 2).map((article, i) => (
              <NewsCard key={i} {...article} />
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl font-bold">Latest News</h2>
            <Button variant="outline">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsArticles.slice(2).map((article, i) => (
              <NewsCard key={i} {...article} />
            ))}
          </div>
        </section>

        {/* Categories Preview */}
        <section>
          <h2 className="font-display text-4xl font-bold mb-8">
            Explore by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "World", color: "from-blue-600 to-blue-800" },
              { name: "Business", color: "from-green-600 to-green-800" },
              { name: "Technology", color: "from-purple-600 to-purple-800" },
              { name: "Sports", color: "from-orange-600 to-orange-800" },
              { name: "Entertainment", color: "from-pink-600 to-pink-800" },
              { name: "Science", color: "from-teal-600 to-teal-800" },
              { name: "Politics", color: "from-red-600 to-red-800" },
              { name: "AI & Innovation", color: "from-indigo-600 to-indigo-800" },
            ].map((category) => (
              <div
                key={category.name}
                className={`relative h-32 rounded-lg overflow-hidden group cursor-pointer bg-gradient-to-br ${category.color}`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="relative h-full flex items-center justify-center">
                  <h3 className="font-display text-xl font-bold text-white">
                    {category.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
