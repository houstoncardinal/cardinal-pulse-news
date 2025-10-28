import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, TrendingUp, Target, Users, BarChart3, Zap } from "lucide-react";

const Advertise = () => {
  const tiers = [
    {
      name: "Starter",
      price: "$499",
      period: "/month",
      description: "Perfect for small businesses testing the waters",
      features: [
        "Banner ads on category pages",
        "Up to 100,000 impressions/month",
        "Basic analytics dashboard",
        "Mobile & desktop placement",
        "Standard support",
      ],
      icon: Target,
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$1,499",
      period: "/month",
      description: "Ideal for growing businesses seeking visibility",
      features: [
        "Everything in Starter, plus:",
        "Homepage banner placement",
        "Up to 500,000 impressions/month",
        "Advanced analytics & reporting",
        "Priority ad placement",
        "Sponsored content opportunities (1/month)",
        "Dedicated account manager",
        "A/B testing capabilities",
      ],
      icon: TrendingUp,
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For brands demanding maximum impact",
      features: [
        "Everything in Professional, plus:",
        "Unlimited impressions",
        "Premium homepage takeover options",
        "Custom native advertising units",
        "Sponsored content series (unlimited)",
        "Real-time performance tracking",
        "Multi-platform campaigns",
        "White-glove service",
        "Exclusive partnership opportunities",
      ],
      icon: Zap,
      highlighted: false,
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Engaged Audience",
      description: "Reach thousands of daily readers actively consuming news and trending topics",
    },
    {
      icon: Target,
      title: "Precision Targeting",
      description: "Target by category, location, device, and reader interests for maximum ROI",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track impressions, clicks, conversions, and engagement in real-time",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Advertise With Us - Cardinal News</title>
        <meta name="description" content="Reach engaged readers with Cardinal News advertising. Flexible plans, powerful targeting, and measurable results for businesses of all sizes." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Amplify Your Brand
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Connect with an engaged audience of informed readers. Cardinal News delivers your message 
              to thousands of daily visitors across trending topics, breaking news, and in-depth analysis.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 border-border hover:border-primary transition-colors">
                <benefit.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>

          {/* Pricing Tiers */}
          <div className="mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
              Advertising Plans
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Choose the perfect plan for your business goals. All plans include transparent reporting 
              and flexible month-to-month contracts.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {tiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`p-8 relative ${
                    tier.highlighted 
                      ? 'border-primary border-2 shadow-lg scale-105' 
                      : 'border-border'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <tier.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-display text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="font-display text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground ml-2">{tier.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={tier.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Ad Formats Section */}
          <div className="bg-muted/30 rounded-lg p-8 md:p-12 mb-16">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">Available Ad Formats</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-display text-xl font-bold mb-3">Display Advertising</h3>
                <p className="text-muted-foreground mb-2">Premium banner placements across homepage and category pages</p>
                <p className="text-sm text-muted-foreground">Sizes: 728x90, 300x250, 320x50 (mobile)</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-display text-xl font-bold mb-3">Native Advertising</h3>
                <p className="text-muted-foreground mb-2">Sponsored content that matches our editorial style</p>
                <p className="text-sm text-muted-foreground">Clearly labeled, high-engagement format</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-display text-xl font-bold mb-3">Sponsored Articles</h3>
                <p className="text-muted-foreground mb-2">Full-length branded content written by our team</p>
                <p className="text-sm text-muted-foreground">SEO-optimized, shareable, permanent placement</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-display text-xl font-bold mb-3">Newsletter Sponsorship</h3>
                <p className="text-muted-foreground mb-2">Feature your brand in our daily newsletter</p>
                <p className="text-sm text-muted-foreground">Direct access to engaged subscribers</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Contact our advertising team to discuss your goals and create a custom campaign 
              that drives results for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Schedule a Call
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Download Media Kit
              </Button>
            </div>
            <div className="mt-8 p-6 bg-card border border-border rounded-lg">
              <p className="font-semibold mb-2">Contact Advertising Sales</p>
              <p className="text-muted-foreground">
                Hunain Qureshi -{" "}
                <a href="tel:+12819017016" className="text-primary hover:underline font-medium">
                  (281) 901-7016
                </a>
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
        <MobileToolbar />
      </div>
    </>
  );
};

export default Advertise;
