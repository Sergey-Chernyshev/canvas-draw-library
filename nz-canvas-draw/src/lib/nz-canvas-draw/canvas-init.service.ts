import type { ElementRef } from "@angular/core";
import { inject, Injectable } from "@angular/core";
import { CanvasService } from "./services/canvas.service";
import { CanvasRenderUtilsService } from "./services/canvas-editor/canvas-render-utils.service";
import { CanvasEventsService } from "./services/canvas-editor/canvas-events.service";
import { CanvasZoomService } from "./services/canvas-editor/canvas-zoom.service";
import { CanvasControlService } from "./services/control/canvas-control.service";
import type { CanvasSettings } from "./canvas-settings/canvas-settings.interface";
import { CanvasSettingsService } from "./canvas-settings/canvas-settings.service";

@Injectable({
    providedIn: "root",
})
export class CanvasInitService {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #canvasEventsService = inject(CanvasEventsService);
    readonly #canvasZoomService = inject(CanvasZoomService);
    readonly #canvasControlService = inject(CanvasControlService);
    readonly #canvasSettingsService = inject(CanvasSettingsService);

    initCanvas(canvasRef: ElementRef<HTMLCanvasElement>, canvasSettings?: Partial<CanvasSettings>): void {
        this.#canvasService.canvasRef = canvasRef;
        const context = canvasRef.nativeElement.getContext("2d");
        if (!context) {
            console.error("Context not found");
            return;
        }
        this.#canvasService.ctx = context;

        this.#canvasRenderUtilsService.resizeCanvas();
        this.#canvasEventsService.initListeners();
        this.#canvasZoomService.initializeZoom();
        this.#canvasZoomService.initializePan();
        if (canvasSettings) {
            this.#canvasSettingsService.updateSettings(canvasSettings);
        }

        const menuRef = this.#canvasSettingsService.getSettings().menuRef;
        if (menuRef) {
            this.#canvasControlService.setupCanvasEditorMenu(menuRef);
        }
    }
}
