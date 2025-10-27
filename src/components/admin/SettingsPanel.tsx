import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const SettingsPanel = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      setLocalSettings(settingsMap);
    }
  }, [settings]);

  const handleSave = async (key: string, value: any) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Settings</h2>
      
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autopublish">Auto-Publish Articles</Label>
            <p className="text-sm text-muted-foreground">
              Automatically publish generated articles
            </p>
          </div>
          <Switch
            id="autopublish"
            checked={localSettings.autopublish_enabled === true}
            onCheckedChange={(checked) => {
              setLocalSettings(prev => ({ ...prev, autopublish_enabled: checked }));
              handleSave('autopublish_enabled', checked);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fetch_interval">Trend Fetch Interval (hours)</Label>
          <div className="flex gap-2">
            <Input
              id="fetch_interval"
              type="number"
              min="1"
              max="24"
              value={localSettings.fetch_interval_hours || 2}
              onChange={(e) => 
                setLocalSettings(prev => ({ ...prev, fetch_interval_hours: parseInt(e.target.value) }))
              }
            />
            <Button 
              onClick={() => handleSave('fetch_interval_hours', localSettings.fetch_interval_hours)}
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="generate_interval">Article Generation Interval (hours)</Label>
          <div className="flex gap-2">
            <Input
              id="generate_interval"
              type="number"
              min="1"
              max="24"
              value={localSettings.generate_interval_hours || 2}
              onChange={(e) => 
                setLocalSettings(prev => ({ ...prev, generate_interval_hours: parseInt(e.target.value) }))
              }
            />
            <Button 
              onClick={() => handleSave('generate_interval_hours', localSettings.generate_interval_hours)}
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_articles">Max Articles Per Run</Label>
          <div className="flex gap-2">
            <Input
              id="max_articles"
              type="number"
              min="1"
              max="20"
              value={localSettings.max_articles_per_run || 5}
              onChange={(e) => 
                setLocalSettings(prev => ({ ...prev, max_articles_per_run: parseInt(e.target.value) }))
              }
            />
            <Button 
              onClick={() => handleSave('max_articles_per_run', localSettings.max_articles_per_run)}
              disabled={updateSetting.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
