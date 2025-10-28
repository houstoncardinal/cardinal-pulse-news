import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/TranslationContext";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

export const LanguageTranslator = () => {
  const { currentLanguage, isTranslating, translatePage } = useTranslation();

  const handleLanguageChange = async (langCode: string) => {
    await translatePage(langCode);
  };

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative hover:bg-accent/50 transition-all duration-300"
          aria-label="Change language"
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Globe className="h-5 w-5" />
          )}
          <span className="absolute -bottom-1 -right-1 text-xs">
            {currentLang.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 max-h-96 overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50 shadow-lg"
      >
        <DropdownMenuLabel className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isTranslating}
            className={`cursor-pointer flex items-center gap-3 ${
              currentLanguage === lang.code ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {currentLanguage === lang.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
