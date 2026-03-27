import {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { existsSync } from "fs";

// Register Arial Bold if available on the system
const fontPaths = [
  "C:\\Windows\\Fonts\\arialbd.ttf",
  "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf",
  "/Library/Fonts/Arial Bold.ttf",
];
for (const p of fontPaths) {
  if (existsSync(p)) {
    GlobalFonts.registerFromPath(p, "ArialBold");
    break;
  }
}

@action({ UUID: "com.laxe4k.timecard-plugin.timecard" })
export class TimecardAction extends SingletonAction<TimecardSettings> {
  private updateIntervals = new Map<string, NodeJS.Timeout>();
  private lastDisplayedTime = new Map<string, string>();
  private bgImageCache = new Map<string, Awaited<ReturnType<typeof loadImage>>>();

  private static readonly presets: Record<
    string,
    { label: string; timezone: string }
  > = {
    be: { label: "BE", timezone: "Europe/Brussels" },
    ca: { label: "CA", timezone: "America/Toronto" },
    ch: { label: "CH", timezone: "Europe/Zurich" },
    fr: { label: "FR", timezone: "Europe/Paris" },
  };

  override onWillAppear(
    ev: WillAppearEvent<TimecardSettings>,
  ): void | Promise<void> {
    this.startImageRefresh(ev);
  }

  override onWillDisappear(
    ev: WillDisappearEvent<TimecardSettings>,
  ): void | Promise<void> {
    const contextId = ev.action.id;
    this.stopImageRefresh(contextId);
    this.lastDisplayedTime.delete(contextId);
    this.bgImageCache.clear();
  }

  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<TimecardSettings>,
  ): void | Promise<void> {
    this.stopImageRefresh(ev.action.id);
    this.lastDisplayedTime.delete(ev.action.id);
    this.bgImageCache.clear();
    this.startImageRefresh(ev);
  }

  override async onKeyDown(ev: KeyDownEvent<TimecardSettings>): Promise<void> {
    this.lastDisplayedTime.delete(ev.action.id);
    await this.updateCountryImage(ev);
  }

  private getTimecardConfig(settings: TimecardSettings): {
    label: string;
    timezone: string;
  } {
    const preset = settings.selectedCountry
      ? TimecardAction.presets[settings.selectedCountry]
      : undefined;
    const timezone =
      settings.customTimezone?.trim() || preset?.timezone || "Europe/Paris";
    const label = settings.customLabel?.trim() || preset?.label || "FR";
    return { label, timezone };
  }

  private async updateCountryImage(
    ev:
      | WillAppearEvent<TimecardSettings>
      | KeyDownEvent<TimecardSettings>
      | DidReceiveSettingsEvent<TimecardSettings>,
  ): Promise<void> {
    const contextId = ev.action.id;
    const { label, timezone } = this.getTimecardConfig(ev.payload.settings);

    const now = new Date();
    let timeStr: string;
    let dateStr: string;

    try {
      timeStr = new Intl.DateTimeFormat("fr-FR", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now);

      dateStr = new Intl.DateTimeFormat("fr-FR", {
        timeZone: timezone,
        day: "2-digit",
        month: "2-digit",
      }).format(now);
    } catch {
      if (this.lastDisplayedTime.get(contextId) !== "__error__") {
        this.lastDisplayedTime.set(contextId, "__error__");
        await ev.action.setTitle("TZ?");
        await ev.action.setImage("");
      }
      return;
    }

    const displayKey = `${label}|${timeStr}|${dateStr}`;
    if (this.lastDisplayedTime.get(contextId) === displayKey) {
      return;
    }
    this.lastDisplayedTime.set(contextId, displayKey);

    // Generate PNG image
    const W = 128,
      H = 128;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Background: image or solid color
    const bgPath = ev.payload.settings.backgroundImage;
    if (bgPath) {
      try {
        let img = this.bgImageCache.get(bgPath);
        if (!img) {
          img = await loadImage(bgPath);
          this.bgImageCache.set(bgPath, img);
        }
        ctx.drawImage(img, 0, 0, W, H);
      } catch {
        ctx.fillStyle = "#04202f";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = "#04202f";
      ctx.fillRect(0, 0, W, H);
    }

    // Text settings — matching Python's Pillow output
    const fontFamily = "ArialBold, Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Country label (25pt)
    ctx.font = `bold 25px ${fontFamily}`;
    ctx.fillText(label.substring(0, 10), W / 2, 28);

    // Time (35pt)
    ctx.font = `bold 35px ${fontFamily}`;
    ctx.fillText(timeStr, W / 2, 64);

    // Date (25pt)
    ctx.font = `bold 25px ${fontFamily}`;
    ctx.fillText(dateStr, W / 2, 100);

    const pngBuffer = canvas.toBuffer("image/png");
    const dataUri = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    await Promise.all([ev.action.setTitle(""), ev.action.setImage(dataUri)]);
  }

  private startImageRefresh(
    ev:
      | WillAppearEvent<TimecardSettings>
      | DidReceiveSettingsEvent<TimecardSettings>,
  ): void {
    const contextId = ev.action.id;
    this.stopImageRefresh(contextId);
    this.updateCountryImage(ev);
    const interval = setInterval(() => {
      this.updateCountryImage(ev);
    }, 1000);
    this.updateIntervals.set(contextId, interval);
  }

  private stopImageRefresh(contextId: string): void {
    const interval = this.updateIntervals.get(contextId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(contextId);
    }
  }
}

type TimecardSettings = {
  selectedCountry?: string;
  customTimezone?: string;
  customLabel?: string;
  backgroundImage?: string;
};
