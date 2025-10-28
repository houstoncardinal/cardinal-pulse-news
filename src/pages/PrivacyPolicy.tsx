import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Cardinal News</title>
        <meta name="description" content="Learn how Cardinal News collects, uses, and protects your personal information." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="font-display text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cardinal News ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Information We Collect</h2>
              <h3 className="font-display text-xl font-semibold mb-3">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Subscribe to our newsletter</li>
                <li>Create an account</li>
                <li>Contact us</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              
              <h3 className="font-display text-xl font-semibold mb-3 mt-6">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We automatically collect certain information when you visit our website, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve and personalize your experience</li>
                <li>Send you newsletters and updates (with your consent)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Analyze usage patterns and trends</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our website. You can 
                instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services for analytics, advertising, and other purposes. These third 
                parties may have access to your information only to perform tasks on our behalf.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="tel:+12819017016" className="text-primary hover:underline">
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

export default PrivacyPolicy;
