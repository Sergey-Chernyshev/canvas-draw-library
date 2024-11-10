import { inject, Injectable, OnDestroy, OnInit } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { CanvasRenderUtilsService } from './canvas-render-utils.service';
import { CanvasStateService } from './canvas-state.service';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CanvasZoomService implements OnDestroy {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #canvasStateService = inject(CanvasStateService);

    private readonly minScale = 0.1;
    private readonly maxScale = 10;
    private readonly scaleFactor = 1.03;

    private readonly destroy$ = new Subject<void>();

    initializeZoom(): void {
        const canvasRef = this.#canvasService.canvasRef;
        if (!canvasRef) {
            throw new Error('Canvas context is not available');
        }

        const canvas = canvasRef.nativeElement;

        // Создаем Observable для события wheel
        fromEvent<WheelEvent>(canvas, 'wheel')
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe(event => {
                const { offsetX, offsetY, scale } = this.#canvasStateService.transformState;

                event.preventDefault();
                const mouseX = event.offsetX;
                const mouseY = event.offsetY;

                const zoomFactor = event.deltaY < 0 ? this.scaleFactor : 1 / this.scaleFactor;

                let newScale = scale * zoomFactor;
                newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

                const newOffsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
                const newOffsetY = mouseY - (mouseY - offsetY) * (newScale / scale);

                this.#canvasStateService.transformState.offsetX = newOffsetX;
                this.#canvasStateService.transformState.offsetY = newOffsetY;
                this.#canvasStateService.transformState.scale = newScale;

                this.#canvasRenderUtilsService.redrawCanvas();
            });
    }

    initializePan(): void {
        const canvasRef = this.#canvasService.canvasRef;
        if (!canvasRef) {
            throw new Error('Canvas context is not available');
        }

        const mousedown$ = fromEvent<MouseEvent>(canvasRef.nativeElement, 'mousedown');
        const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove');
        const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup');

        let isPanning = false;
        let startX = 0;
        let startY = 0;

        mousedown$
            .pipe(takeUntil(this.destroy$))
            .subscribe(event => {
                isPanning = true;
                const { offsetX, offsetY } = this.#canvasStateService.transformState;

                startX = event.clientX - offsetX;
                startY = event.clientY - offsetY;
            });

        mousemove$
            .pipe(takeUntil(this.destroy$))
            .subscribe(event => {
                if (!isPanning) return;

                const newOffsetX = event.clientX - startX;
                const newOffsetY = event.clientY - startY;

                this.#canvasStateService.transformState.offsetX = newOffsetX;
                this.#canvasStateService.transformState.offsetY = newOffsetY;

                this.#canvasRenderUtilsService.redrawCanvas();
            });

        mouseup$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                isPanning = false;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
