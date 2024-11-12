import { isPointInPolygon } from '../utils/coordinates-utils.utils';
import { CanvasDotCoordinate, CanvasPolygon } from '../element/models/element.interface';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { CanvasStateService } from './canvas-state.service';
import { PolygonsStoreService } from '../element/polygons-store.service';
import { EditorState } from './models/canvas-editor.service';
import { fromEvent, map, Subject, switchMap, tap, throttleTime } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CanvasRenderUtilsService } from './canvas-render-utils.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasEventsService implements OnDestroy {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);


    private isDragging = false;
    private startX = 0;
    private startY = 0;
    private dragThreshold = 10; // Пороговое значение для определения движения
    #isPolygonDragging = false;

    private readonly destroy$ = new Subject<void>();

    initListeners(): void {
        const canvasRef = this.#canvasService.canvasRef?.nativeElement;
        if (!canvasRef) {
            return;
        }

        const mousedown$ = fromEvent<MouseEvent>(canvasRef, 'mousedown');
        const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(throttleTime(0));
        const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup');

        mousedown$
            .pipe(takeUntil(this.destroy$), switchMap((startEvent) => {
                const { offsetX, offsetY, scale } = this.#canvasStateService.transformState;
                const startCanvasX = (startEvent.clientX - canvasRef.getBoundingClientRect().left - offsetX) / scale;
                const startCanvasY = (startEvent.clientY - canvasRef.getBoundingClientRect().top - offsetY) / scale;

                this.startX = startCanvasX;
                this.startY = startCanvasY;
                this.isDragging = false;

                return mousemove$.pipe(map(moveEvent => {
                    const canvasCoordinates = this.getCanvasCoordinates(moveEvent);
                    return {
                        x: canvasCoordinates.x - this.startX, y: canvasCoordinates.y - this.startY, moveEvent: moveEvent
                    };
                }), tap(event => {
                    const distance = Math.sqrt(event.x * event.x + event.y * event.y);
                    if (!this.isDragging && distance > this.dragThreshold) {
                        this.isDragging = true;
                    }
                    if (this.isDragging) {
                        this.#handleCanvasDragging(event, event.moveEvent);
                    }
                }), takeUntil(mouseup$.pipe(tap((mouseupEvent) => {
                    if (!this.isDragging) {
                        this.#handleCanvasClick(mouseupEvent);
                    } else {
                        this.isDragging = false;
                        this.#isPolygonDragging = false;
                    }
                }))));
            }))
            .subscribe();
    }

    getCanvasCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
        const canvasRef = this.#canvasService.canvasRef;
        if (!canvasRef || !canvasRef.nativeElement) {
            throw new Error('Canvas element is not available');
        }

        const canvasElement = canvasRef.nativeElement;
        const rect = canvasElement.getBoundingClientRect();

        let clientX: number, clientY: number;
        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else if (event instanceof TouchEvent && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            throw new Error('Unsupported event type');
        }

        const x = (clientX - rect.left - this.#canvasStateService.transformState.offsetX) / this.#canvasStateService.transformState.scale;
        const y = (clientY - rect.top - this.#canvasStateService.transformState.offsetY) / this.#canvasStateService.transformState.scale;

        return { x, y };
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    #handleCanvasDragging(coords: CanvasDotCoordinate, event: MouseEvent): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;
        const canvasCoordinates = this.getCanvasCoordinates(event);

        const offsetX = this.#canvasStateService.transformState.offsetX;
        const offsetY = this.#canvasStateService.transformState.offsetY;

        let isOnSelectedPolygon = false;
        if (selectedPolygon) {
            isOnSelectedPolygon = isPointInPolygon(canvasCoordinates, selectedPolygon.vertices);
        }
        // drag
        if (!isOnSelectedPolygon && !this.#isPolygonDragging) {
            this.#canvasStateService.transformState.offsetX += coords.x;
            this.#canvasStateService.transformState.offsetY += coords.y;
            this.#canvasRenderUtilsService.redrawCanvas();
        }
        // drag polygons
        else if (this.#canvasStateService.editorState.stateValue === 'selectMode') {
            if ((isOnSelectedPolygon || this.#isPolygonDragging) && selectedPolygon) {
                this.#isPolygonDragging = true;
                const rect = this.#canvasService.canvasRef!.nativeElement.getBoundingClientRect();

                // текущие положение мыши на канвасе, где offsetX - смещение положения всех его полигонов при перемещении канваса
                const x = (event.clientX - rect.left - offsetX) / this.#canvasStateService.transformState.scale;
                const y = (event.clientY - rect.top - offsetY) / this.#canvasStateService.transformState.scale;

                // смещение относительно предыдущей позиции мыши
                const deltaX = x - this.startX;
                const deltaY = y - this.startY;

                // Обновляем вершины полигона на основе смещения
                selectedPolygon.vertices = selectedPolygon.vertices.map(vertex => ({
                    x: vertex.x + deltaX, y: vertex.y + deltaY
                }));

                this.startX = x;
                this.startY = y;

                this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, selectedPolygon);
                this.#canvasRenderUtilsService.redrawCanvas();
            }
        }
    }

    #handleCanvasClick(event: MouseEvent | TouchEvent): void {
        const { x, y } = this.getCanvasCoordinates(event);
        const canvasEditorState: EditorState = this.#canvasStateService.editorState;
        this.#polygonsStoreService.selectAllPolygons.forEach((polygon: CanvasPolygon) => {
            if (canvasEditorState.stateValue) {
                const isClickInPolygon = isPointInPolygon({ x, y }, polygon.vertices);
                if (isClickInPolygon) {
                    const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId;
                    if (prevPolygonId === polygon.id) {
                        this.#canvasStateService.editorState.stateValue = 'viewMode';
                        this.#canvasStateService.editorState.selectedPolygonId = null;
                        polygon.state = 'Normal';
                        this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                        return;
                    }
                    if (prevPolygonId) {
                        const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);
                        if (prevPolygon) {
                            prevPolygon.state = 'Normal';
                            this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
                        }
                    }
                    this.#canvasStateService.editorState.stateValue = 'selectMode';
                    this.#canvasStateService.editorState.selectedPolygonId = polygon.id;
                    polygon.state = 'Selected';
                    this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                }
            }
        });
    }
}
