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

    constructor() {
        this.#polygonsStoreService.selectAllPolygons$.pipe(takeUntilDestroyed()).subscribe(() => {
            if (this.#canvasService.ctx && this.#canvasService.canvasRef) {
                this.redrawCanvas();
            }
        });
    }

    resizeCanvas(): void {
        console.log("resize");
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
        requestAnimationFrame(() => this.redrawCanvasWithAnimationFrame());
    }

    private redrawCanvasWithAnimationFrame() {
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context or canvasRef is not available");
        }

        const offsetX = this.#canvasStateService.transformState.offsetX;
        const offsetY = this.#canvasStateService.transformState.offsetY;
        const scale = this.#canvasStateService.transformState.scale;

        ctx.clearRect(0, 0, canvasRef.nativeElement.width, canvasRef.nativeElement.height);
        ctx.save();

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        // Рисуем все полигоны
        this.#polygonsStoreService.selectAllPolygons.forEach((polygon: CanvasPolygon) => {
            this.#polygonsService.drawPolygon(polygon);
        });
        ctx.restore();
    }
}
