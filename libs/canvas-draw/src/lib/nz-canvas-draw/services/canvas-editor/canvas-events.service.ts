import { findPointInPolygonVertex, isPointInPolygon } from "../utils/coordinates-utils.utils";
import type { CanvasDotCoordinate, CanvasPolygon } from "../element/models/element.interface";
import type { OnDestroy } from "@angular/core";
import { inject, Injectable } from "@angular/core";
import { CanvasService } from "../canvas.service";
import { CanvasStateService } from "./canvas-state.service";
import { PolygonsStoreService } from "../element/polygons-store.service";
import type { EditorState } from "./models/canvas-editor.interface";
import { fromEvent, map, Subject, switchMap, tap, throttleTime } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CanvasRenderUtilsService } from "./canvas-render-utils.service";

enum DragState {
    None = "none",
    Canvas = "canvas",
    Polygon = "polygon",
    Vertex = "vertex",
}

@Injectable({
    providedIn: "root",
})
export class CanvasEventsService implements OnDestroy {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);

    private isDragging = false;
    private startX = 0;
    private startY = 0;
    private dragThreshold = 1;
    private dragState: DragState = DragState.None;
    private draggedVertexIndex: number | null = null;

    // Добавлены новые свойства для хранения начальных значений
    private prevClientX = 0;
    private prevClientY = 0;

    private lastFrameTime = performance.now();
    private frames = 0;
    private fps = 0;

    private readonly destroy$ = new Subject<void>();

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initListeners(): void {
        const canvasRef = this.#canvasService.canvasRef?.nativeElement;
        if (!canvasRef) {
            return;
        }

        const mousedown$ = fromEvent<MouseEvent>(canvasRef, "mousedown");
        const mousemove$ = fromEvent<MouseEvent>(window, "mousemove").pipe(throttleTime(1));
        const mouseup$ = fromEvent<MouseEvent>(window, "mouseup");

        mousedown$
            .pipe(
                takeUntil(this.destroy$),
                switchMap((startEvent) => {
                    const { offsetX, offsetY, scale } = this.#canvasStateService.transformState;
                    const startCanvasX =
                        (startEvent.clientX - canvasRef.getBoundingClientRect().left - offsetX) / scale;
                    const startCanvasY = (startEvent.clientY - canvasRef.getBoundingClientRect().top - offsetY) / scale;

                    this.startX = startCanvasX;
                    this.startY = startCanvasY;
                    this.isDragging = false;
                    this.dragState = DragState.None;
                    this.draggedVertexIndex = null;

                    // Сохраняем начальные смещения и позиции курсора
                    this.prevClientX = startEvent.clientX;
                    this.prevClientY = startEvent.clientY;

                    const canvasCoordinates = {
                        x: this.startX,
                        y: this.startY,
                    };
                    const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;
                    let isOnSelectedPolygon = false;
                    let isOnSelectedPolygonVertex: number | null = null;
                    if (selectedPolygon) {
                        isOnSelectedPolygon = isPointInPolygon(canvasCoordinates, selectedPolygon.vertices);
                        isOnSelectedPolygonVertex = findPointInPolygonVertex(
                            canvasCoordinates,
                            selectedPolygon.vertices,
                            10
                        );
                    }

                    if (isOnSelectedPolygonVertex !== null) {
                        this.dragState = DragState.Vertex;
                        this.draggedVertexIndex = isOnSelectedPolygonVertex;
                    } else if (isOnSelectedPolygon) {
                        this.dragState = DragState.Polygon;
                    } else {
                        this.dragState = DragState.Canvas;
                    }

                    return mousemove$.pipe(
                        map((moveEvent) => {
                            // Вычисляем дельту перемещения курсора
                            const deltaX = moveEvent.clientX - this.prevClientX;
                            const deltaY = moveEvent.clientY - this.prevClientY;

                            // Обновляем предыдущие позиции курсора
                            this.prevClientX = moveEvent.clientX;
                            this.prevClientY = moveEvent.clientY;

                            const canvasCoordinates = this.#getCanvasCoordinates(moveEvent);
                            return {
                                x: canvasCoordinates.x - this.startX,
                                y: canvasCoordinates.y - this.startY,
                                deltaX,
                                deltaY,
                                moveEvent: moveEvent,
                            };
                        }),
                        tap((event) => {
                            const distance = Math.sqrt(event.x * event.x + event.y * event.y);
                            if (!this.isDragging && distance > this.dragThreshold) {
                                this.isDragging = true;
                            }
                            if (this.isDragging) {
                                this.#handleCanvasDragging(event, event.moveEvent);
                            }
                        }),
                        takeUntil(
                            mouseup$.pipe(
                                tap(() => {
                                    if (!this.isDragging) {
                                        this.#handleCanvasClick(startEvent);
                                    }
                                    this.isDragging = false;
                                    this.dragState = DragState.None;
                                    this.draggedVertexIndex = null;
                                })
                            )
                        )
                    );
                })
            )
            .subscribe();
    }

    #getCanvasCoordinates(event: MouseEvent | TouchEvent): {
        x: number;
        y: number;
    } {
        const canvasRef = this.#canvasService.canvasRef;
        if (!canvasRef || !canvasRef.nativeElement) {
            throw new Error("Canvas element is not available");
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
            throw new Error("Unsupported event type");
        }

        const x =
            (clientX - rect.left - this.#canvasStateService.transformState.offsetX) /
            this.#canvasStateService.transformState.scale;
        const y =
            (clientY - rect.top - this.#canvasStateService.transformState.offsetY) /
            this.#canvasStateService.transformState.scale;

        return { x, y };
    }

    private updateFPS(): void {
        const currentTime = performance.now();
        const delta = (currentTime - this.lastFrameTime) / 1000;
        this.frames++;

        if (delta >= 0.2) {
            this.fps = this.frames / delta;
            this.frames = 0;
            this.lastFrameTime = currentTime;
            console.log(`FPS: ${Math.round(this.fps)}`);
        }
    }

    #handleCanvasDragging(coords: CanvasDotCoordinate & { deltaX: number; deltaY: number }, event: MouseEvent): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;

        switch (this.dragState) {
            case DragState.Canvas:
                // Обновляем смещения канваса на основе дельты перемещения курсора
                this.#canvasStateService.transformState.offsetX += coords.deltaX;
                this.#canvasStateService.transformState.offsetY += coords.deltaY;
                break;
            case DragState.Polygon: {
                if (!selectedPolygon) return;

                // Вычисляем дельту перемещения в координатах канваса
                const { x, y } = this.#getCanvasCoordinates(event);
                const deltaX = x - this.startX;
                const deltaY = y - this.startY;

                selectedPolygon.vertices = selectedPolygon.vertices.map((vertex) => ({
                    x: vertex.x + deltaX,
                    y: vertex.y + deltaY,
                }));
                this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, selectedPolygon);

                // Обновляем начальные координаты для следующего шага
                this.startX = x;
                this.startY = y;
                break;
            }
            case DragState.Vertex: {
                if (!selectedPolygon || this.draggedVertexIndex === null) return;

                // Вычисляем дельту перемещения вершины
                const vertexCoords = this.#getCanvasCoordinates(event);
                const vdeltaX = vertexCoords.x - this.startX;
                const vdeltaY = vertexCoords.y - this.startY;

                selectedPolygon.vertices[this.draggedVertexIndex] = {
                    x: selectedPolygon.vertices[this.draggedVertexIndex].x + vdeltaX,
                    y: selectedPolygon.vertices[this.draggedVertexIndex].y + vdeltaY,
                };
                this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, selectedPolygon);

                // Обновляем начальные координаты для следующего шага
                this.startX = vertexCoords.x;
                this.startY = vertexCoords.y;
                break;
            }
            default:
                break;
        }

        this.#canvasRenderUtilsService.redrawCanvas();
        this.updateFPS();
    }

    #handleCanvasClick(event: MouseEvent | TouchEvent): void {
        const { x, y } = this.#getCanvasCoordinates(event);
        const canvasEditorState: EditorState = this.#canvasStateService.editorState;
        let polygonClicked = false;

        this.#polygonsStoreService.selectAllPolygons.forEach((polygon: CanvasPolygon) => {
            if (canvasEditorState.stateValue) {
                const isClickInPolygon = isPointInPolygon({ x, y }, polygon.vertices);
                if (isClickInPolygon) {
                    polygonClicked = true;
                    const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId;
                    if (prevPolygonId === polygon.id) {
                        this.#canvasStateService.updateEditorState({
                            stateValue: "viewMode",
                        });
                        polygon.state = "Normal";
                        this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                        this.#canvasRenderUtilsService.redrawCanvas();
                        return;
                    }
                    if (prevPolygonId) {
                        const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);
                        if (prevPolygon) {
                            prevPolygon.state = "Normal";
                            this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
                        }
                    }
                    this.#canvasStateService.updateEditorState({
                        stateValue: "selectMode",
                    });
                    this.#canvasStateService.editorState.selectedPolygonId = polygon.id;
                    polygon.state = "Selected";
                    this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                    this.#canvasRenderUtilsService.redrawCanvas();
                    this.updateFPS();
                }
            }
        });

        if (!polygonClicked) {
            // Если ни один полигон не был кликнут, снимаем выделение
            const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId;
            if (prevPolygonId) {
                const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);
                if (prevPolygon) {
                    prevPolygon.state = "Normal";
                    this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
                }
            }
            this.#canvasStateService.updateEditorState({
                stateValue: "viewMode",
            });
            this.#canvasRenderUtilsService.redrawCanvas();
            this.updateFPS();
        }
    }
}
