import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const categories = [
  "World",
  "Business",
  "Technology",
  "Sports",
  "Entertainment",
  "Science",
  "Politics",
  "AI & Innovation",
];

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">The Pulse of the Planet</span>
            <span className="text-primary">• LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Breaking News • 24/7 Coverage</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {categories.map((category) => (
                  <a
                    key={category}
                    href="#"
                    className="text-lg hover:text-primary transition-colors"
                  >
                    {category}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-foreground rounded-full" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              <span className="text-primary">Cardinal</span>{" "}
              <span className="text-foreground">News</span>
            </h1>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mt-6 text-sm">
          {categories.map((category) => (
            <a
              key={category}
              href="#"
              className="hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              {category}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};
