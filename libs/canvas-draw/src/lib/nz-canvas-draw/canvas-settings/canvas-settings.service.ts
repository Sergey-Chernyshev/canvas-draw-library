import { Injectable } from "@angular/core";
import type { CanvasSettings } from "./canvas-settings.interface";
import { DEFAULT_CANVAS_SETTINGS } from "./canvas-settings.interface";

@Injectable({
    providedIn: "root",
})
export class CanvasSettingsService {
    private settings: CanvasSettings = DEFAULT_CANVAS_SETTINGS;

    getSettings(): CanvasSettings {
        return this.settings;
    }

    updateSettings(partialSettings: Partial<CanvasSettings>): void {
        this.settings = { ...this.settings, ...partialSettings };
    }
}
