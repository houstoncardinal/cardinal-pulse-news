import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TranslationContextType {
  currentLanguage: string;
  isTranslating: boolean;
  translatePage: (languageCode: string) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "en"
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalTexts, setOriginalTexts] = useState<Map<Element, string>>(new Map());
  const { toast } = useToast();

  const getTextNodes = (element: Element): Element[] => {
    const textElements: Element[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const el = node as Element;
          // Skip script, style, and elements with data-no-translate
          if (
            el.tagName === 'SCRIPT' ||
            el.tagName === 'STYLE' ||
            el.hasAttribute('data-no-translate') ||
            el.closest('[data-no-translate]')
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          // Only include elements with direct text content
          if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
            const text = el.textContent?.trim();
            if (text && text.length > 0) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      textElements.push(node as Element);
    }
    return textElements;
  };

  const translatePage = async (languageCode: string) => {
    if (languageCode === "en") {
      // Restore original texts
      originalTexts.forEach((originalText, element) => {
        if (element && document.body.contains(element)) {
          element.textContent = originalText;
        }
      });
      setCurrentLanguage("en");
      localStorage.setItem("preferredLanguage", "en");
      toast({
        title: "Language Reset",
        description: "Page restored to English",
      });
      return;
    }

    setIsTranslating(true);

    try {
      const elements = getTextNodes(document.body);
      
      // Store original texts if not already stored
      if (originalTexts.size === 0) {
        const newOriginalTexts = new Map<Element, string>();
        elements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text) {
            newOriginalTexts.set(el, text);
          }
        });
        setOriginalTexts(newOriginalTexts);
      }

      // Extract texts to translate
      const textsToTranslate = elements
        .map((el) => el.textContent?.trim())
        .filter((text): text is string => !!text);

      if (textsToTranslate.length === 0) {
        throw new Error("No text found to translate");
      }

      // Batch translate in chunks of 50
      const chunkSize = 50;
      const translations: string[] = [];
      
      for (let i = 0; i < textsToTranslate.length; i += chunkSize) {
        const chunk = textsToTranslate.slice(i, i + chunkSize);
        
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: { 
            texts: chunk, 
            targetLanguage: getLanguageName(languageCode) 
          }
        });

        if (error) throw error;
        if (!data?.translations) throw new Error("No translations received");
        
        translations.push(...data.translations);
      }

      // Apply translations
      elements.forEach((el, index) => {
        if (translations[index] && document.body.contains(el)) {
          el.textContent = translations[index];
        }
      });

      setCurrentLanguage(languageCode);
      localStorage.setItem("preferredLanguage", languageCode);

      toast({
        title: "Translation Complete",
        description: `Page translated to ${getLanguageName(languageCode)}`,
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "Failed to translate page",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",
    };
    return languages[code] || code;
  };

  // Re-translate on route changes if not English
  useEffect(() => {
    if (currentLanguage !== "en") {
      const timer = setTimeout(() => {
        translatePage(currentLanguage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [window.location.pathname]);

  return (
    <TranslationContext.Provider value={{ currentLanguage, isTranslating, translatePage }}>
      {children}
    </TranslationContext.Provider>
  );
};
