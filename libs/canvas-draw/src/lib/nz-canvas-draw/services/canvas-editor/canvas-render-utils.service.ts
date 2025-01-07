import { inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CanvasService } from "../canvas.service";
import type { CanvasPolygon } from "../element/models/element.interface";
import { PolygonsService } from "../element/polygons.service";
import { PolygonsStoreService } from "../element/polygons-store.service";
import { CanvasStateService } from "./canvas-state.service";

@Injectable({
    providedIn: "root",
})
export class CanvasRenderUtilsService {
    readonly #canvasService = inject(CanvasService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    readonly #polygonsService = inject(PolygonsService);
    readonly #canvasStateService = inject(CanvasStateService);
    private isRedrawRequested = false;

    constructor() {
        this.#polygonsStoreService.selectAllPolygons$.pipe(takeUntilDestroyed()).subscribe(() => {
            if (this.#canvasService.ctx && this.#canvasService.canvasRef) {
                this.redrawCanvas();
            }
        });
    }

    resizeCanvas(): void {
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context is not available");
        }

        const canvas = canvasRef.nativeElement;
        const dpr = window.devicePixelRatio || 1;

        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        ctx.scale(dpr, dpr);
        this.redrawCanvas();
    }

    /**
     * Метод для перерисовки канваса.
     */
    redrawCanvas(): void {
        if (this.isRedrawRequested) {
            return;
        }

        this.isRedrawRequested = true;

        requestAnimationFrame(() => this.redrawCanvasWithAnimationFrame());
    }

    private redrawCanvasWithAnimationFrame(): void {
        this.isRedrawRequested = false; // Сброс флага

        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context or canvasRef is not available");
        }

        const { offsetX, offsetY, scale } = this.#canvasStateService.transformState;

        ctx.save();
        ctx.clearRect(0, 0, canvasRef.nativeElement.width, canvasRef.nativeElement.height);

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        ctx.beginPath();
        this.#polygonsStoreService.selectAllPolygons.forEach((polygon: CanvasPolygon) => {
            this.#polygonsService.drawPolygon(polygon);
        });
        ctx.closePath();

        ctx.restore();
    }
}
