import { inject, Injectable, OnDestroy, OnInit } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { PolygonsStoreService } from '../element/polygons-store.service';
import { CanvasPolygon } from '../element/models/element.interface';
import { PolygonsService } from '../element/polygons.service';
import { Subject, takeUntil } from 'rxjs';
import { CanvasStateService } from './canvas-state.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasRenderUtilsService implements OnDestroy {
    readonly #canvasService = inject(CanvasService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    readonly #polygonsService = inject(PolygonsService);
    readonly #canvasStateService = inject(CanvasStateService);
    #destroy = new Subject<void>();


    constructor() {
        console.log("change data")
        this.#polygonsStoreService.selectAllPolygons$
            .pipe(takeUntil(this.#destroy))
            .subscribe(() => {
                if (this.#canvasService.ctx && this.#canvasService.canvasRef){
                    this.redrawCanvas();
                }
            });

    }

    resizeCanvas(): void {
        console.log('resize');
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;
        if (!ctx || !canvasRef) {
            throw new Error('Canvas context is not available');
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
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;
        if (!ctx || !canvasRef) {
            throw new Error('Canvas context or canvasRef is not available');
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

    ngOnDestroy(): void {
        this.#destroy.next();
        this.#destroy.complete();
    }

}
