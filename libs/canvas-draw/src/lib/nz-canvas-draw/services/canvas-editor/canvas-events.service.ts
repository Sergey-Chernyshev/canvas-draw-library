import { DestroyRef, inject, Injectable, OnDestroy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { KeyShortcutsService } from "@nz/key-shortcuts";
import { fromEvent, map, Subject, switchMap, takeUntil, tap } from "rxjs";

import { CanvasService } from "../canvas.service";
import { CanvasPolygonTypes } from "../element/models/element.interface";
import { PolygonsService } from "../element/polygons.service";
import { PolygonsStoreService } from "../element/polygons-store.service";
import { findPointInPolygonVertex } from "../utils/coordinates-utils.utils";
import { CanvasRenderUtilsService } from "./canvas-render-utils.service";
import { CanvasStateService } from "./canvas-state.service";
import { DrawModeService } from "./draw-mode/draw-mode.service";
import { EditorMode, Point, PointerMoveData } from "./models";

enum DragState {
    None = "none",
    Canvas = "canvas",
    Polygon = "polygon",
    Vertex = "vertex",
}

@Injectable({ providedIn: "root" })
export class CanvasEventsService implements OnDestroy {
    private dragState = DragState.None;
    private startX = 0;
    private startY = 0;
    private prevClientX = 0;
    private prevClientY = 0;
    private isDragging = false;
    private draggedVertexIndex: number | null = null;
    private readonly dragThreshold = 1;
    private lastFrameTime = performance.now();
    private frames = 0;
    private fps = 0;
    readonly destroy$ = new Subject<void>();
    readonly #canvasService = inject(CanvasService);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #keyShortcutsService = inject(KeyShortcutsService);
    readonly #polygonService = inject(PolygonsService);
    readonly #drawModeService = inject(DrawModeService);
    #isCursorOnLastVertex = false;

    constructor() {
        this.#keyShortcutsService.registerShortcut(
            ["Escape"],
            () => {
                const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

                if (draftPolygon) {
                    console.log(draftPolygon);
                    this.#polygonsStoreService.removePolygonById(draftPolygon.id);
                    this.#drawModeService.finalizePreviewLine();
                }

                this.#deselectElement();
            },
            true,
        );

        this.#keyShortcutsService.registerShortcut(
            ["P"],
            () => {
                const editorState = this.#canvasStateService.editorState.editorMode;

                if (editorState !== EditorMode.DrawPolygon) {
                    this.#canvasStateService.updateEditorState({ editorMode: "drawPolygon" });
                }
            },
            true,
        );

        this.#keyShortcutsService.registerShortcut(
            ["L"],
            () => {
                const editorState = this.#canvasStateService.editorState.editorMode;

                if (editorState !== EditorMode.DrawLine) {
                    this.#canvasStateService.updateEditorState({ editorMode: "drawLine" });
                }
            },
            true,
        );

        this.#keyShortcutsService.registerShortcut(
            ["Enter"],
            () => {
                this.endDraw();
            },
            true,
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initListeners(): void {
        const canvasRef = this.#canvasService.canvasRef?.nativeElement;

        if (!canvasRef) {
            return;
        }

        fromEvent<PointerEvent>(canvasRef, "pointermove")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event) => {
                this.onPointerMoveNoDownKey(event);
            });

        fromEvent<PointerEvent>(canvasRef, "pointerdown")
            .pipe(
                switchMap((startEvent) => {
                    this.onPointerDown(startEvent);

                    return fromEvent<PointerEvent>(window, "pointermove").pipe(
                        map((moveEvent) => this.getMoveData(moveEvent)),
                        tap((moveData) => this.onPointerMove(moveData)),
                        takeUntil(
                            fromEvent<PointerEvent>(window, "pointerup").pipe(
                                tap((endEvent) => this.onPointerUp(endEvent, startEvent)),
                            ),
                        ),
                    );
                }),
                takeUntilDestroyed(this.#destroyRef),
            )
            .subscribe();
    }

    private endDraw(): void {
        const editorState = this.#canvasStateService.editorState;

        if (editorState.editorMode === "drawPolygon" && editorState.draftPolygon) {
            this.#polygonsStoreService.updatePolygonById(editorState.draftPolygon.id, {
                type: CanvasPolygonTypes.Polygon,
            });
            console.log("Рисование полигона окончено");
        }

        if (editorState.editorMode === "drawLine" && editorState.draftPolygon) {
            this.#polygonsStoreService.updatePolygonById(editorState.draftPolygon.id, {
                type: CanvasPolygonTypes.Line,
            });
            console.log("Рисование линии окончено");
        }

        this.#deselectElement();
        this.#isCursorOnLastVertex = false;
        this.#drawModeService.finalizePreviewLine();
        this.#drawModeService.removeTemporaryPolygon();
    }

    private onPointerDown(event: PointerEvent): void {
        const { offsetX, offsetY, scale } = this.#canvasStateService.transformState;
        const rect = this.#canvasService.canvasRef?.nativeElement.getBoundingClientRect();

        if (!rect) {
            return;
        }

        const startCanvasX = (event.clientX - rect.left - offsetX) / scale;
        const startCanvasY = (event.clientY - rect.top - offsetY) / scale;

        this.startX = startCanvasX;
        this.startY = startCanvasY;
        this.prevClientX = event.clientX;
        this.prevClientY = event.clientY;
        this.isDragging = false;
        this.dragState = DragState.None;
        this.draggedVertexIndex = null;
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;
        const canvasCoordinates = { x: startCanvasX, y: startCanvasY };
        let isOnSelectedPolygon = false;
        let isOnSelectedPolygonVertex: number | null = null;

        if (selectedPolygon) {
            isOnSelectedPolygon = this.isPointInPolygon(canvasCoordinates, selectedPolygon.vertices);
            isOnSelectedPolygonVertex = this.findPointInPolygonVertex(canvasCoordinates, selectedPolygon.vertices, 10);
        }

        if (isOnSelectedPolygonVertex !== null) {
            this.dragState = DragState.Vertex;
            this.draggedVertexIndex = isOnSelectedPolygonVertex;
        } else if (isOnSelectedPolygon) {
            this.dragState = DragState.Polygon;
        } else {
            this.dragState = DragState.Canvas;
        }
    }

    private onPointerMove(data: PointerMoveData): void {
        const distance = Math.sqrt(data.x * data.x + data.y * data.y);

        if (!this.isDragging && distance > this.dragThreshold) {
            this.isDragging = true;
        }

        if (!this.isDragging) {
            return;
        }

        this.handleDragging(data);
    }

    private onPointerUp(event: PointerEvent, startEvent: PointerEvent): void {
        if (!this.isDragging) {
            this.handleClick(startEvent);
        }

        this.isDragging = false;
        this.dragState = DragState.None;
        this.draggedVertexIndex = null;
    }

    private getMoveData(event: PointerEvent): PointerMoveData {
        const deltaX = event.clientX - this.prevClientX;
        const deltaY = event.clientY - this.prevClientY;

        this.prevClientX = event.clientX;
        this.prevClientY = event.clientY;
        const { x, y } = this.getCanvasCoordinates(event);

        return {
            x: x - this.startX,
            y: y - this.startY,
            deltaX,
            deltaY,
        };
    }

    private handleDragging(coords: PointerMoveData): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;

        // перемещение камеры canvas
        if (this.dragState === DragState.Canvas) {
            this.#canvasStateService.transformState.offsetX += coords.deltaX;
            this.#canvasStateService.transformState.offsetY += coords.deltaY;
        }

        if (this.dragState === DragState.Polygon && selectedPolygon) {
            const { x, y } = { x: this.startX + coords.x, y: this.startY + coords.y };
            const deltaX = x - this.startX;
            const deltaY = y - this.startY;

            selectedPolygon.vertices = selectedPolygon.vertices.map((v) => ({
                x: v.x + deltaX,
                y: v.y + deltaY,
            }));
            this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, selectedPolygon);
            this.startX = x;
            this.startY = y;
        }

        if (this.dragState === DragState.Vertex && selectedPolygon && this.draggedVertexIndex !== null) {
            const vertexCoords = { x: this.startX + coords.x, y: this.startY + coords.y };
            const vdeltaX = vertexCoords.x - this.startX;
            const vdeltaY = vertexCoords.y - this.startY;

            selectedPolygon.vertices[this.draggedVertexIndex] = {
                x: selectedPolygon.vertices[this.draggedVertexIndex].x + vdeltaX,
                y: selectedPolygon.vertices[this.draggedVertexIndex].y + vdeltaY,
            };
            this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, selectedPolygon);
            this.startX = vertexCoords.x;
            this.startY = vertexCoords.y;
        }

        this.#canvasRenderUtilsService.redrawCanvas();
        this.updateFPS();
    }

    private onPointerMoveNoDownKey(event: PointerEvent): void {
        const mode = this.#canvasStateService.editorState.editorMode;

        if (mode === "drawPolygon") {
            const cursorVertex = this.getCanvasCoordinates(event);
            const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

            if (draftPolygon && draftPolygon.vertices.length > 0) {
                const lastVertex = draftPolygon.vertices[draftPolygon.vertices.length - 1];

                this.#drawModeService.createOrUpdatePreviewLine(lastVertex, cursorVertex);

                const isOnVertex = findPointInPolygonVertex(cursorVertex, [draftPolygon.vertices[0]], 5);

                if (isOnVertex === 0 && draftPolygon.vertices.length > 2) {
                    this.#drawModeService.addTemporaryPolygon(draftPolygon);
                    this.#isCursorOnLastVertex = true;
                } else {
                    this.#drawModeService.removeTemporaryPolygon();
                    this.#isCursorOnLastVertex = false;
                }
            }
        }
    }

    private handleClick(event: PointerEvent): void {
        const mode = this.#canvasStateService.editorState.editorMode;
        const { x, y } = this.getCanvasCoordinates(event);

        console.log(mode);

        if (mode === "drawPolygon" || mode === "drawLine") {
            console.log("drawPolygon");

            const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

            if (!draftPolygon) {
                console.log("draftPolygon: ", this.#canvasStateService.editorState.draftPolygon, x, y);

                const newPolygon = this.#polygonService.savePolygonData([{ x, y }], CanvasPolygonTypes.Line);

                newPolygon.state = "Selected";

                this.#canvasStateService.editorState.selectedPolygonId = newPolygon.id;
                this.#canvasStateService.editorState.draftPolygon = newPolygon;
                console.log(this.#canvasStateService.editorState.draftPolygon);
                this.#canvasRenderUtilsService.redrawCanvas();

                return;
            }

            if (mode === "drawPolygon" && this.#isCursorOnLastVertex) {
                this.endDraw();

                return;
            }

            draftPolygon.vertices.push({ x, y });
            this.#polygonsStoreService.updatePolygonById(draftPolygon.id, draftPolygon);
            this.#canvasRenderUtilsService.redrawCanvas();

            return;
        }

        let polygonClicked = false;

        this.#polygonsStoreService.selectAllPolygons.forEach((polygon) => {
            if (!mode) {
                return;
            }

            const inside = this.isPointInPolygon({ x, y }, polygon.vertices);

            if (inside) {
                polygonClicked = true;
                const prevId = this.#canvasStateService.editorState.selectedPolygonId;

                if (prevId === polygon.id) {
                    this.#canvasStateService.updateEditorState({ editorMode: "viewMode" });
                    polygon.state = "Normal";
                    this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                    this.#canvasRenderUtilsService.redrawCanvas();

                    return;
                }

                if (prevId) {
                    const prevPolygon = this.#polygonsStoreService.getPolygonById(prevId);

                    if (prevPolygon) {
                        prevPolygon.state = "Normal";
                        this.#polygonsStoreService.updatePolygonById(prevId, prevPolygon);
                    }
                }

                this.#canvasStateService.updateEditorState({ editorMode: "selectMode" });
                this.#canvasStateService.editorState.selectedPolygonId = polygon.id;
                polygon.state = "Selected";
                this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                this.#canvasRenderUtilsService.redrawCanvas();
                this.updateFPS();
            }
        });

        if (!polygonClicked) {
            this.#deselectElement();
        }
    }

    #deselectElement(): void {
        const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId;

        if (prevPolygonId) {
            const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);

            if (prevPolygon) {
                prevPolygon.state = "Normal";
                this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
            }

            this.#canvasStateService.updateEditorState({ editorMode: "viewMode" });
            this.#canvasRenderUtilsService.redrawCanvas();
            this.updateFPS();
        }
    }

    private getCanvasCoordinates(event: PointerEvent): Point {
        const canvasRef = this.#canvasService.canvasRef;

        if (!canvasRef?.nativeElement) {
            throw new Error("Canvas element is not available");
        }

        const rect = canvasRef.nativeElement.getBoundingClientRect();
        const clientX = event.clientX;
        const clientY = event.clientY;
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
            console.log(Math.round(this.fps));
        }
    }

    private isPointInPolygon(point: Point, vertices: Point[]): boolean {
        let inside = false;

        for (let i = 0; i < vertices.length; i++) {
            const j = i === vertices.length - 1 ? 0 : i + 1;
            const xi = vertices[i].x;
            const yi = vertices[i].y;
            const xj = vertices[j].x;
            const yj = vertices[j].y;
            const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    }

    private findPointInPolygonVertex(point: Point, vertices: Point[], radius: number): number | null {
        for (let i = 0; i < vertices.length; i++) {
            const dx = vertices[i].x - point.x;
            const dy = vertices[i].y - point.y;

            if (dx * dx + dy * dy <= radius * radius) {
                return i;
            }
        }

        return null;
    }
}
