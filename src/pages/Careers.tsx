import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, TrendingUp, Heart } from "lucide-react";

const Careers = () => {
  return (
    <>
      <Helmet>
        <title>Careers - Cardinal News</title>
        <meta name="description" content="Join the Cardinal News team and help shape the future of AI-powered journalism." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Help us build the future of journalism where AI and human expertise combine to deliver 
              exceptional news coverage to millions of readers worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            <Card className="p-6 border-border">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-3">Collaborative Culture</h3>
              <p className="text-muted-foreground">
                Work with talented journalists, developers, and AI specialists in a supportive environment.
              </p>
            </Card>
            
            <Card className="p-6 border-border">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-3">Growth Opportunities</h3>
              <p className="text-muted-foreground">
                Advance your career with continuous learning and professional development programs.
              </p>
            </Card>
            
            <Card className="p-6 border-border">
              <Briefcase className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-3">Cutting-Edge Technology</h3>
              <p className="text-muted-foreground">
                Work with the latest AI technologies and tools in the rapidly evolving media landscape.
              </p>
            </Card>
            
            <Card className="p-6 border-border">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-3">Meaningful Impact</h3>
              <p className="text-muted-foreground">
                Shape how millions of people consume news and stay informed about the world.
              </p>
            </Card>
          </div>

          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">Open Positions</h2>
            
            <div className="space-y-6">
              <Card className="p-6 border-border hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">Senior Journalist</h3>
                    <p className="text-muted-foreground">Full-time • Remote</p>
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
                <p className="text-muted-foreground">
                  Lead editorial direction, mentor junior staff, and ensure quality across all content.
                </p>
              </Card>

              <Card className="p-6 border-border hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">AI Content Specialist</h3>
                    <p className="text-muted-foreground">Full-time • Hybrid</p>
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
                <p className="text-muted-foreground">
                  Optimize AI-generated content and develop new editorial automation workflows.
                </p>
              </Card>

              <Card className="p-6 border-border hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">Full-Stack Developer</h3>
                    <p className="text-muted-foreground">Full-time • Remote</p>
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
                <p className="text-muted-foreground">
                  Build and maintain our platform using React, TypeScript, and modern backend technologies.
                </p>
              </Card>

              <Card className="p-6 border-border hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">Business Development Manager</h3>
                    <p className="text-muted-foreground">Full-time • Houston, TX</p>
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
                <p className="text-muted-foreground">
                  Drive advertising partnerships and revenue growth for Cardinal News.
                </p>
              </Card>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-4">Don't See the Right Role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented individuals to join our team. Send us your resume 
              and let us know how you can contribute to Cardinal News.
            </p>
            <Button size="lg">Submit General Application</Button>
            <p className="text-sm text-muted-foreground mt-6">
              Contact: <a href="tel:+12819017016" className="text-primary hover:underline">(281) 901-7016</a>
            </p>
          </div>
        </main>
        
        <Footer />
        <MobileToolbar />
      </div>
    </>
  );
};

export default Careers;
