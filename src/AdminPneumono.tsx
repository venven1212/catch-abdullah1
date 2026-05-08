import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LEVELS, TIMED_LEVELS, LevelKey, TimedKey, AnyLevelKey, loadSave, saveSave, clearSave, SaveData } from "@/lib/game";
import { loadAdmin, saveAdmin, broadcastAnnouncement, AdminOverrides } from "@/lib/admin";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminPneumono = () => {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [admin, setAdmin] = useState<AdminOverrides>(loadAdmin);
  const [coinInput, setCoinInput] = useState<string>("");
  const [announceInput, setAnnounceInput] = useState<string>("");

  useEffect(() => { saveSave(save); }, [save]);
  useEffect(() => { saveAdmin(admin); }, [admin]);

  const stdLevels: LevelKey[] = ["easy", "medium", "hard", "extreme"];
  const timedLevels: TimedKey[] = ["tEasy", "tMedium", "tHard", "tExtreme"];

  const setSpeed = (key: AnyLevelKey, value: number) => {
    setAdmin((a) => ({ ...a, speeds: { ...a.speeds, [key]: value } }));
  };

  const resetSpeed = (key: AnyLevelKey) => {
    setAdmin((a) => {
      const next = { ...a.speeds };
      delete next[key];
      return { ...a, speeds: next };
    });
  };

  const handleSetCoins = () => {
    const n = parseInt(coinInput, 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid non-negative number."); return; }
    setSave((s) => ({ ...s, coins: n }));
    toast.success(`Coins set to ${n}`);
  };

  const handleAnnounce = () => {
    const msg = announceInput.trim();
    if (!msg) { toast.error("Type an announcement first."); return; }
    broadcastAnnouncement(msg);
    toast.success("Announcement broadcast.");
    setAnnounceInput("");
  };

  const masterUnlock = () => {
    setSave((s) => ({
      ...s,
      extremeUnlocked: true,
      gildedUnlocked: true,
      winCounts: {
        ...s.winCounts,
        extreme: Math.max(s.winCounts.extreme ?? 0, 5),
        tEasy: Math.max(s.winCounts.tEasy ?? 0, 10),
        tMedium: Math.max(s.winCounts.tMedium ?? 0, 6),
        tHard: Math.max(s.winCounts.tHard ?? 0, 3),
      },
    }));
    toast.success("All modes unlocked.");
  };

  const toggleGilded = () => {
    setSave((s) => ({ ...s, gildedUnlocked: true, gildedActive: !s.gildedActive }));
  };

  const wipe = () => {
    if (!confirm("Wipe ALL save data? This cannot be undone.")) return;
    clearSave();
    setSave(loadSave());
    toast.success("Save wiped.");
  };

  const renderSlider = (key: AnyLevelKey, name: string, defaultMs: number) => {
    const current = admin.speeds[key] ?? defaultMs;
    return (
      <div key={key} className="game-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="font-bold">{name}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {current}ms {admin.speeds[key] != null && <span className="text-accent">(override)</span>}
          </span>
        </div>
        <input
          type="range"
          min={80}
          max={2000}
          step={20}
          value={current}
          onChange={(e) => setSpeed(key, parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            min={50}
            max={5000}
            value={current}
            onChange={(e) => setSpeed(key, parseInt(e.target.value, 10) || defaultMs)}
            className="w-24 px-2 py-1 rounded-lg bg-background border border-border text-sm"
          />
          <button
            onClick={() => resetSpeed(key)}
            className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/70"
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="game-card rounded-full p-3 inline-flex">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold neon-text">🛠 Admin Panel</h1>
          <div className="w-11" />
        </div>

        <p className="text-center text-xs text-muted-foreground mb-6">
          Internal tools — adjust live game state. Current coins: <strong className="text-coin">{save.coins}</strong>
        </p>

        {/* Coin control */}
        <section className="game-card rounded-3xl p-5 mb-5">
          <h2 className="text-xl font-bold mb-3">🪙 Coin Control</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter exact amount"
              value={coinInput}
              onChange={(e) => setCoinInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border"
            />
            <button onClick={handleSetCoins} className="hero-gradient text-primary-foreground font-bold px-5 py-2 rounded-xl">
              Set Coins
            </button>
          </div>
        </section>

        {/* Announcements */}
        <section className="game-card rounded-3xl p-5 mb-5">
          <h2 className="text-xl font-bold mb-3">📣 Global Announcement</h2>
          <p className="text-xs text-muted-foreground mb-2">Pops on the game screen for 10 seconds, then fades.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Message to broadcast"
              value={announceInput}
              onChange={(e) => setAnnounceInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border"
            />
            <button onClick={handleAnnounce} className="hero-gradient text-primary-foreground font-bold px-5 py-2 rounded-xl">
              Send
            </button>
          </div>
        </section>

        {/* Master unlock + Gilded */}
        <section className="game-card rounded-3xl p-5 mb-5">
          <h2 className="text-xl font-bold mb-3">🔓 Progression</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={masterUnlock} className="hero-gradient text-primary-foreground font-bold px-4 py-2 rounded-xl">
              Unlock All Modes
            </button>
            <button
              onClick={toggleGilded}
              className={`font-bold px-4 py-2 rounded-xl ${save.gildedActive ? "bg-coin text-coin-foreground" : "bg-muted"}`}
            >
              Gilded Mode: {save.gildedActive ? "ON" : "OFF"}
            </button>
            <button onClick={wipe} className="bg-destructive text-destructive-foreground font-bold px-4 py-2 rounded-xl">
              Wipe Save
            </button>
          </div>
        </section>

        {/* Speed overrides */}
        <section className="game-card rounded-3xl p-5 mb-5">
          <h2 className="text-xl font-bold mb-3">⚙️ Speed Overrides (moveIntervalMs)</h2>
          <p className="text-xs text-muted-foreground mb-3">Lower = faster movement. Applies live to the game screen.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {stdLevels.map((k) => renderSlider(k, LEVELS[k].name, LEVELS[k].moveIntervalMs))}
          </div>
          <h3 className="font-bold mb-2 mt-4">Timed Trials</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {timedLevels.map((k) => renderSlider(k, TIMED_LEVELS[k].name, TIMED_LEVELS[k].moveIntervalMs))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPneumono;
