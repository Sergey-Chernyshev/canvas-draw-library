import { DestroyRef, inject, Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";

import { CanvasService } from "../canvas.service";
import { CanvasRenderUtilsService } from "./canvas-render-utils.service";
import { CanvasStateService } from "./canvas-state.service";

@Injectable({
    providedIn: "root",
})
export class CanvasZoomService {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #canvasStateService = inject(CanvasStateService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly minScale = 0.1;
    private readonly maxScale = 10;
    private readonly scaleFactor = 1.03;

    initializeZoom(): void {
        const canvasRef = this.#canvasService.canvasRef;

        if (!canvasRef) {
            throw new Error("Canvas context is not available");
        }

        const canvas = canvasRef.nativeElement;

        fromEvent<WheelEvent>(canvas, "wheel")
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
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
        // const canvasRef = this.#canvasService.canvasRef;
        // if (!canvasRef) {
        //     throw new Error('Canvas context is not available');
        // }
        //
        // const mousedown$ = fromEvent<MouseEvent>(canvasRef.nativeElement, 'mousedown');
        // const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        //     throttleTime(0)
        // );
        // const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup');
        //
        // mousedown$
        //     .pipe(
        //         takeUntil(this.destroy$),
        //         switchMap((startEvent) => {
        //             const { offsetX, offsetY } = this.#canvasStateService.transformState;
        //             const startX = startEvent.clientX - offsetX;
        //             const startY = startEvent.clientY - offsetY;
        //
        //             console.log("старт: ", startX, startY);
        //
        //             return mousemove$.pipe(
        //                 map(moveEvent => ({
        //                     x: moveEvent.clientX - startX,
        //                     y: moveEvent.clientY - startY
        //                 })),
        //                 tap(coords => {
        //                     this.#canvasStateService.transformState.offsetX = coords.x;
        //                     this.#canvasStateService.transformState.offsetY = coords.y;
        //                     this.#canvasRenderUtilsService.redrawCanvas();
        //                     console.log("Смещение: ", coords.x, coords.y);
        //                 }),
        //                 takeUntil(mouseup$)
        //             );
        //         })
        //     )
        //     .subscribe({
        //         complete: () => {
        //             console.log('Панорамирование завершено');
        //         }
        //     });
    }
}
