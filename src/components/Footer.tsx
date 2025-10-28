import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  Company: ["About Us", "Careers", "Contact", "Press Kit"],
  Resources: ["Help Center", "API", "Guidelines", "Privacy Policy"],
  Categories: ["World", "Business", "Technology", "Sports"],
  Follow: ["Newsletter", "Podcasts", "Events", "Mobile App"],
};

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h3 className="font-display text-2xl font-bold mb-4">
            Stay Informed with Cardinal News
          </h3>
          <p className="text-muted-foreground mb-6">
            Get the latest trending stories delivered to your inbox daily
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-background"
            />
            <Button className="whitespace-nowrap">Subscribe</Button>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-foreground rounded-full" />
            </div>
            <span className="font-display font-bold text-lg">
              <span className="text-primary">Cardinal</span> News
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 Cardinal News. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Linkedin, Youtube].map(
              (Icon, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              )
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Interested in writing for Cardinal News? Contact Hunain Qureshi at{" "}
            <a href="tel:+12819017016" className="text-primary hover:underline font-medium">
              (281) 901-7016
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
