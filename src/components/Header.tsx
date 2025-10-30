import { useState } from "react";
import { Menu, Search, Shield, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageTranslator } from "@/components/LanguageTranslator";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { SearchDialog } from "@/components/SearchDialog";

const categories = [
  "World",
  "Business",
  "Technology",
  "Sports",
  "Entertainment",
  "Music",
  "Movies",
  "Events",
  "Science",
  "Politics",
  "AI & Innovation",
];

const navigationLinks = [
  { label: "Weather", path: "/weather", emoji: "🌍" },
  { label: "Stocks", path: "/stocks", emoji: "📈" },
  { label: "Community", path: "/community", emoji: "👥" },
  ...categories.map(cat => ({ 
    label: cat, 
    path: `/category/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`,
    emoji: null 
  })),
];

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
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
                {navigationLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="text-lg hover:text-primary transition-colors flex items-center gap-2"
                  >
                    {link.emoji && <span>{link.emoji}</span>}
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border pt-4 mt-4">
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="text-lg hover:text-primary transition-colors flex items-center gap-2 mb-3"
                        >
                          <Shield className="h-5 w-5" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="text-lg hover:text-primary transition-colors flex items-center gap-2 w-full text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      className="text-lg hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-primary-foreground rounded-full" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight whitespace-nowrap">
              <span className="text-primary">Cardinal</span>{" "}
              <span className="text-foreground">News</span>
            </h1>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="relative w-full"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                className="pl-10 bg-secondary border-border cursor-pointer"
                readOnly
              />
            </button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <AccessibilityMenu />
            <LanguageTranslator />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden md:flex">
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mt-6 text-sm">
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="hover:text-primary transition-colors font-medium whitespace-nowrap flex items-center gap-1"
            >
              {link.emoji && <span className="text-base">{link.emoji}</span>}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
    </>
  );
};
