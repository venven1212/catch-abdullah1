import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, X, RotateCcw, Zap, Mountain, Skull, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadAdmin, saveAdmin, resetLabMode, LabModeSettings } from "@/lib/admin";

interface LabPanelProps {
  onClose: () => void;
}

export const LabPanel = ({ onClose }: LabPanelProps) => {
  const [settings, setSettings] = useState<LabModeSettings>({
    enabled: false,
    targetSpeed: 1,
    hazardDensity: 50,
    gravity: 1,
    godMode: false,
  });

  useEffect(() => {
    const admin = loadAdmin();
    if (admin.labMode) {
      setSettings({
        enabled: admin.labMode.enabled ?? false,
        targetSpeed: admin.labMode.targetSpeed ?? 1,
        hazardDensity: admin.labMode.hazardDensity ?? 50,
        gravity: admin.labMode.gravity ?? 1,
        godMode: admin.labMode.godMode ?? false,
      });
    }
  }, []);

  const handleChange = <K extends keyof LabModeSettings>(key: K, value: LabModeSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    const admin = loadAdmin();
    admin.labMode = newSettings;
    saveAdmin(admin);
  };

  const handleReset = () => {
    resetLabMode();
    setSettings({
      enabled: false,
      targetSpeed: 1,
      hazardDensity: 50,
      gravity: 1,
      godMode: false,
    });
  };

  const isModified = settings.enabled || settings.godMode || 
    settings.targetSpeed !== 1 || settings.hazardDensity !== 50 || settings.gravity !== 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="game-card rounded-3xl p-6 max-w-md w-full border-2 border-accent/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold neon-text">Custom Lab</h2>
              <p className="text-xs text-muted-foreground">Experiment with game settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        {isModified && (
          <div className="bg-destructive/20 border border-destructive/40 rounded-xl p-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <Skull className="w-4 h-4" />
              Lab Mode Active
            </div>
            <p className="text-destructive/80 text-xs mt-1">
              Scores cannot be submitted to leaderboards while Lab settings are modified.
            </p>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-4">
          {/* Enable Lab Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-accent" />
              <span className="font-bold text-sm">Enable Lab Mode</span>
            </div>
            <button
              onClick={() => handleChange("enabled", !settings.enabled)}
              className={cn(
                "px-4 py-1 rounded-full text-xs font-bold transition-all",
                settings.enabled 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {settings.enabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Speed Multiplier */}
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">Speed / Z-Velocity</span>
              </div>
              <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                {settings.targetSpeed?.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.targetSpeed ?? 1}
              onChange={(e) => handleChange("targetSpeed", parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Hazard Density */}
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-destructive" />
                <span className="font-bold text-sm">Hazard Density</span>
              </div>
              <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                {settings.hazardDensity ?? 50}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.hazardDensity ?? 50}
              onChange={(e) => handleChange("hazardDensity", parseInt(e.target.value))}
              className="w-full accent-destructive"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>None</span>
              <span>Chaos</span>
            </div>
          </div>

          {/* Gravity */}
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-secondary" />
                <span className="font-bold text-sm">Gravity</span>
              </div>
              <span className="text-xs font-mono bg-background px-2 py-1 rounded">
                {settings.gravity?.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={settings.gravity ?? 1}
              onChange={(e) => handleChange("gravity", parseFloat(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* God Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-coin" />
              <span className="font-bold text-sm">God Mode (Invincible)</span>
            </div>
            <button
              onClick={() => handleChange("godMode", !settings.godMode)}
              className={cn(
                "px-4 py-1 rounded-full text-xs font-bold transition-all",
                settings.godMode 
                  ? "bg-coin text-coin-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {settings.godMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-muted/70 transition-colors font-bold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </motion.div>
    </motion.div>
  );
};
