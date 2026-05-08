import { LevelKey, TimedKey } from "./game";

export type AdminSpeedKey = LevelKey | TimedKey;

export interface LabModeSettings {
  enabled: boolean;
  targetSpeed?: number; // Custom target/scroll speed multiplier
  hazardDensity?: number; // 0-100 percent
  gravity?: number; // Custom gravity multiplier
  godMode?: boolean; // Invincibility
}

export interface AdminOverrides {
  speeds: Partial<Record<AdminSpeedKey, number>>; // moveIntervalMs override
  labMode?: LabModeSettings; // Lab Mode settings
}

const ADMIN_KEY = "abdullah_admin_overrides";
const ANNOUNCE_KEY = "abdullah_admin_announce";

export const loadAdmin = (): AdminOverrides => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return { speeds: {}, labMode: { enabled: false } };
    const parsed = JSON.parse(raw);
    return { 
      speeds: {}, 
      labMode: { enabled: false },
      ...parsed 
    };
  } catch {
    return { speeds: {}, labMode: { enabled: false } };
  }
};

export const saveAdmin = (data: AdminOverrides) => {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
    // Trigger same-tab listeners
    window.dispatchEvent(new CustomEvent("abdullah_admin_change"));
  } catch { /* ignore */ }
};

/**
 * Check if Lab Mode is currently active
 * Returns true if any Lab Mode settings are enabled/modified
 */
export const isLabModeActive = (): boolean => {
  const admin = loadAdmin();
  if (!admin.labMode) return false;
  
  // Lab mode is active if explicitly enabled OR if any custom settings are applied
  if (admin.labMode.enabled) return true;
  if (admin.labMode.godMode) return true;
  if (admin.labMode.targetSpeed !== undefined && admin.labMode.targetSpeed !== 1) return true;
  if (admin.labMode.hazardDensity !== undefined && admin.labMode.hazardDensity !== 50) return true;
  if (admin.labMode.gravity !== undefined && admin.labMode.gravity !== 1) return true;
  
  // Also check if any speed overrides are active
  if (Object.keys(admin.speeds).length > 0) return true;
  
  return false;
};

/**
 * Reset all Lab Mode settings to defaults
 */
export const resetLabMode = () => {
  const admin = loadAdmin();
  admin.labMode = { enabled: false };
  admin.speeds = {};
  saveAdmin(admin);
};

export interface Announcement {
  id: number;
  message: string;
  ts: number;
}

export const broadcastAnnouncement = (message: string) => {
  const a: Announcement = { id: Date.now(), message, ts: Date.now() };
  try {
    localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(a));
    window.dispatchEvent(new CustomEvent("abdullah_admin_announce", { detail: a }));
  } catch { /* ignore */ }
};

export const readLastAnnouncement = (): Announcement | null => {
  try {
    const raw = localStorage.getItem(ANNOUNCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
