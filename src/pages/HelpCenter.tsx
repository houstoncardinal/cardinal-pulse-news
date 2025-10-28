import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileToolbar } from "@/components/MobileToolbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const HelpCenter = () => {
  const faqs = [
    {
      question: "What is Cardinal News?",
      answer: "Cardinal News is an AI-powered news platform that delivers high-quality journalism across multiple categories including world news, business, technology, sports, and more. We use advanced AI technology to aggregate, analyze, and present news while maintaining the highest standards of journalistic excellence."
    },
    {
      question: "How does Cardinal News ensure article quality?",
      answer: "All our articles meet Google E-E-A-T compliance standards and are written at a Harvard-graduate level. We prioritize accuracy, fact-checking, and proper source attribution. Articles are reviewed before publication to ensure they meet our quality standards."
    },
    {
      question: "Are the articles written by AI?",
      answer: "Yes, our articles are generated using advanced AI technology. However, they are based on real news sources, properly attributed, and reviewed for quality. We are transparent about our use of AI and clearly label AI-generated images when used."
    },
    {
      question: "How can I subscribe to your newsletter?",
      answer: "You can subscribe to our newsletter by entering your email address in the subscription form located in our website footer. You'll receive daily updates on trending stories and breaking news."
    },
    {
      question: "How do I advertise with Cardinal News?",
      answer: "Visit our Advertise page to learn about our advertising plans and options. You can contact our advertising team at (281) 901-7016 or through our contact form."
    },
    {
      question: "Can I write for Cardinal News?",
      answer: "We welcome contributions from experienced journalists and writers. Contact Hunain Qureshi at (281) 901-7016 to discuss writing opportunities."
    },
    {
      question: "How often is content updated?",
      answer: "Our platform is updated continuously throughout the day with new articles on trending topics and breaking news. We monitor global news sources 24/7 to bring you the latest stories."
    },
    {
      question: "Is Cardinal News available on mobile?",
      answer: "Yes! Cardinal News is fully responsive and optimized for mobile devices. You can access all features and content on your smartphone or tablet."
    },
    {
      question: "How do I report an error in an article?",
      answer: "If you notice an error, please contact us through our Contact page or call (281) 901-7016. We take accuracy seriously and will investigate and correct any errors promptly."
    },
    {
      question: "Do you have a mobile app?",
      answer: "We're currently working on native mobile applications for iOS and Android. Stay tuned for updates by subscribing to our newsletter."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Help Center - Cardinal News</title>
        <meta name="description" content="Find answers to frequently asked questions about Cardinal News, our platform, and services." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-center">Help Center</h1>
            <p className="text-xl text-muted-foreground mb-12 text-center">
              Find answers to common questions about Cardinal News
            </p>

            <div className="relative mb-12">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for help..." 
                className="pl-10"
              />
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-16 p-8 bg-muted/30 rounded-lg text-center">
              <h2 className="font-display text-2xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <p className="text-lg">
                Contact us at{" "}
                <a href="tel:+12819017016" className="text-primary hover:underline font-semibold">
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

export default HelpCenter;
