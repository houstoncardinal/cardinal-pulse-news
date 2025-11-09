import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Users, Target, Award, Globe } from "lucide-react";

const AboutUs = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Cardinal News</title>
        <meta name="description" content="Learn about Cardinal News, our mission, values, and commitment to delivering quality independent journalism." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">About Cardinal News</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Cardinal News represents the future of journalism—where cutting-edge AI technology meets 
              traditional journalistic excellence to deliver comprehensive, timely, and accurate news coverage 
              to readers worldwide.
            </p>

            <section className="mt-12">
              <h2 className="font-display text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to democratizing access to high-quality news by leveraging artificial intelligence 
                to aggregate, analyze, and present the most important stories from around the world. Our mission is 
                to keep you informed with accuracy, speed, and depth—covering trending topics, breaking news, and 
                in-depth analysis across all major categories.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="bg-card border border-border rounded-lg p-6">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Expert Team</h3>
                <p className="text-muted-foreground">
                  Our platform is backed by experienced journalists and tech innovators.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <Target className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Precision Coverage</h3>
                <p className="text-muted-foreground">
                  We analyze thousands of sources to bring you the most accurate and relevant news.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <Award className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Quality Standards</h3>
                <p className="text-muted-foreground">
                  Every article meets Google E-E-A-T compliance and Harvard-level writing standards.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Global Reach</h3>
                <p className="text-muted-foreground">
                  Coverage spans world news, business, technology, sports, entertainment, and more.
                </p>
              </div>
            </div>

            <section>
              <h2 className="font-display text-3xl font-bold mb-6">Our Values</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Accuracy First:</strong> We prioritize factual reporting and source verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Transparency:</strong> Clear attribution and ethical AI usage in all our content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Innovation:</strong> Continuously improving our technology to serve readers better</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary font-bold mr-3">•</span>
                  <span><strong>Accessibility:</strong> Making quality journalism available to everyone</span>
                </li>
              </ul>
            </section>

            <section className="bg-muted/30 rounded-lg p-8 mt-12">
              <h2 className="font-display text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                Interested in writing for Cardinal News or have questions about our platform?
              </p>
              <p className="text-lg">
                Contact Hunain Qureshi at{" "}
                <a href="tel:+12819017016" className="text-primary hover:underline font-semibold">
                  (281) 901-7016
                </a>
              </p>
            </section>
          </div>
        </main>
        
        <Footer />
        <MobileToolbar />
      </div>
    </>
  );
};

export default AboutUs;
