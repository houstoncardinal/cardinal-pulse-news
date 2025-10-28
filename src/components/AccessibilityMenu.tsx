import { useState, useEffect } from "react";
import {
  Accessibility,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Eye,
  Type,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export const AccessibilityMenu = () => {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textToSpeech, setTextToSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  // Load preferences from localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    const savedHighContrast = localStorage.getItem("highContrast") === "true";
    const savedDyslexiaFont = localStorage.getItem("dyslexiaFont") === "true";
    const savedReducedMotion = localStorage.getItem("reducedMotion") === "true";

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    setHighContrast(savedHighContrast);
    setDyslexiaFont(savedDyslexiaFont);
    setReducedMotion(savedReducedMotion);

    // Apply saved preferences
    applyFontSize(savedFontSize ? parseInt(savedFontSize) : 100);
    applyHighContrast(savedHighContrast);
    applyDyslexiaFont(savedDyslexiaFont);
    applyReducedMotion(savedReducedMotion);
  }, []);

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}%`;
    localStorage.setItem("fontSize", size.toString());
  };

  const applyHighContrast = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("highContrast", enabled.toString());
  };

  const applyDyslexiaFont = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("dyslexia-font");
    } else {
      document.documentElement.classList.remove("dyslexia-font");
    }
    localStorage.setItem("dyslexiaFont", enabled.toString());
  };

  const applyReducedMotion = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
    localStorage.setItem("reducedMotion", enabled.toString());
  };

  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0];
    setFontSize(newSize);
    applyFontSize(newSize);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 10, 200);
    setFontSize(newSize);
    applyFontSize(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 10, 50);
    setFontSize(newSize);
    applyFontSize(newSize);
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    applyHighContrast(newValue);
    toast({
      title: newValue ? "High Contrast Enabled" : "High Contrast Disabled",
      description: newValue
        ? "Colors adjusted for better visibility"
        : "Default colors restored",
    });
  };

  const toggleDyslexiaFont = () => {
    const newValue = !dyslexiaFont;
    setDyslexiaFont(newValue);
    applyDyslexiaFont(newValue);
    toast({
      title: newValue ? "Dyslexia-Friendly Font Enabled" : "Default Font Restored",
      description: newValue
        ? "OpenDyslexic font applied for easier reading"
        : "Standard font restored",
    });
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    applyReducedMotion(newValue);
    toast({
      title: newValue ? "Reduced Motion Enabled" : "Animations Restored",
      description: newValue
        ? "Animations minimized for comfort"
        : "Full animations enabled",
    });
  };

  const toggleTextToSpeech = () => {
    const newValue = !textToSpeech;
    setTextToSpeech(newValue);

    if (newValue) {
      toast({
        title: "Text-to-Speech Enabled",
        description: "Click on any article text to hear it read aloud",
      });
      enableTextToSpeech();
    } else {
      toast({
        title: "Text-to-Speech Disabled",
      });
      disableTextToSpeech();
    }
  };

  const enableTextToSpeech = () => {
    document.addEventListener("click", handleTextClick);
  };

  const disableTextToSpeech = () => {
    document.removeEventListener("click", handleTextClick);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleTextClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked element is text content (p, h1-h6, span, div with text)
    if (
      target.tagName === "P" ||
      target.tagName === "H1" ||
      target.tagName === "H2" ||
      target.tagName === "H3" ||
      target.tagName === "H4" ||
      target.tagName === "H5" ||
      target.tagName === "H6" ||
      target.tagName === "SPAN" ||
      target.tagName === "DIV"
    ) {
      const text = target.textContent;
      if (text && text.trim()) {
        speakText(text);
      }
    }
  };

  const speakText = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const resetSettings = () => {
    setFontSize(100);
    setHighContrast(false);
    setDyslexiaFont(false);
    setReducedMotion(false);
    setTextToSpeech(false);

    applyFontSize(100);
    applyHighContrast(false);
    applyDyslexiaFont(false);
    applyReducedMotion(false);
    disableTextToSpeech();

    toast({
      title: "Accessibility Settings Reset",
      description: "All settings restored to default",
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent/50 transition-all duration-300"
          aria-label="Accessibility options"
        >
          <Accessibility className="h-5 w-5" />
          {(highContrast || dyslexiaFont || reducedMotion || textToSpeech || fontSize !== 100) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] overflow-y-auto bg-card/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Accessibility className="h-6 w-6 text-primary" />
            Accessibility Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Font Size Control */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Text Size: {fontSize}%
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={decreaseFontSize}
                aria-label="Decrease font size"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[fontSize]}
                onValueChange={handleFontSizeChange}
                min={50}
                max={200}
                step={10}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={increaseFontSize}
                aria-label="Increase font size"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">High Contrast</div>
                <div className="text-xs text-muted-foreground">
                  Enhanced color contrast
                </div>
              </div>
            </Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={toggleHighContrast}
            />
          </div>

          <Separator />

          {/* Dyslexia-Friendly Font */}
          <div className="flex items-center justify-between">
            <Label htmlFor="dyslexia-font" className="flex items-center gap-2 cursor-pointer">
              <Type className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Dyslexia-Friendly Font</div>
                <div className="text-xs text-muted-foreground">
                  Easier-to-read typeface
                </div>
              </div>
            </Label>
            <Switch
              id="dyslexia-font"
              checked={dyslexiaFont}
              onCheckedChange={toggleDyslexiaFont}
            />
          </div>

          <Separator />

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion" className="flex items-center gap-2 cursor-pointer">
              <Pause className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Reduce Motion</div>
                <div className="text-xs text-muted-foreground">
                  Minimize animations
                </div>
              </div>
            </Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={toggleReducedMotion}
            />
          </div>

          <Separator />

          {/* Text-to-Speech */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="text-to-speech" className="flex items-center gap-2 cursor-pointer">
                {textToSpeech && isSpeaking ? (
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <VolumeX className="h-5 w-5 text-primary" />
                )}
                <div>
                  <div className="font-semibold">Text-to-Speech</div>
                  <div className="text-xs text-muted-foreground">
                    Click text to hear it read
                  </div>
                </div>
              </Label>
              <Switch
                id="text-to-speech"
                checked={textToSpeech}
                onCheckedChange={toggleTextToSpeech}
              />
            </div>
            {textToSpeech && isSpeaking && (
              <Button
                variant="outline"
                onClick={stopSpeaking}
                className="w-full"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Speaking
              </Button>
            )}
          </div>

          <Separator />

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={resetSettings}
            className="w-full"
          >
            Reset All Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
