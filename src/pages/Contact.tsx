import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - Cardinal News</title>
        <meta name="description" content="Get in touch with Cardinal News. We're here to answer your questions, hear your feedback, and explore partnership opportunities." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
              <p className="text-xl text-muted-foreground">
                Have questions, feedback, or partnership inquiries? We'd love to hear from you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">Send us a Message</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input placeholder="How can we help?" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea 
                      placeholder="Tell us more about your inquiry..." 
                      rows={6}
                    />
                  </div>
                  
                  <Button className="w-full" size="lg">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg">
                    <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <a 
                        href="tel:+12819017016" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        (281) 901-7016
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monday - Friday, 9am - 6pm EST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg">
                    <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a 
                        href="mailto:contact@cardinal-news.com" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        contact@cardinal-news.com
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        We'll respond within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-card border border-border rounded-lg">
                    <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Headquarters</h3>
                      <p className="text-muted-foreground">
                        Cardinal News Digital Media<br />
                        Houston, Texas<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-display text-xl font-bold mb-3">Business Inquiries</h3>
                  <p className="text-muted-foreground mb-4">
                    Interested in advertising, partnerships, or writing for Cardinal News?
                  </p>
                  <p className="text-sm">
                    Contact: <strong>Hunain Qureshi</strong><br />
                    <a href="tel:+12819017016" className="text-primary hover:underline">
                      (281) 901-7016
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
        <MobileToolbar />
      </div>
    </>
  );
};

export default Contact;
