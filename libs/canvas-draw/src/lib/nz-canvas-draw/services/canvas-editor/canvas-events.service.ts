import { DestroyRef, inject, Injectable, Renderer2, RendererFactory2 } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { KeyShortcutsService } from "@nz/key-shortcuts";
import { CursorService } from "@nz/nz-common";
import { fromEvent, map, switchMap, takeUntil, tap } from "rxjs";

import { CanvasService } from "../canvas.service";
import { CanvasElement, CanvasElementTypes, ElementService, ElementStoreService } from "../element";
import {
    calculateRotationAngle,
    findPointInPolygonVertex,
    findRectangleCenter,
    isEditorUnEditType,
    isPointOnAnyElementByTypes,
    IsPointOnAnyElementByTypesFuncType,
    rotateVertices,
} from "../utils";
import { CanvasRenderUtilsService } from "./canvas-render-utils.service";
import { CanvasStateService } from "./canvas-state.service";
import { DrawModeService } from "./draw-mode/draw-mode.service";
import { EditorMode, Point, PointerMoveData } from "./models";

enum DragState {
    None = "none",
    Canvas = "canvas",
    Polygon = "polygon",
    Vertex = "vertex",
    Rotate = "rotate",
}

@Injectable({ providedIn: "root" })
export class CanvasEventsService {
    readonly #canvasService = inject(CanvasService);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #polygonsStoreService = inject(ElementStoreService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #keyShortcutsService = inject(KeyShortcutsService);
    readonly #polygonService = inject(ElementService);
    readonly #drawModeService = inject(DrawModeService);
    private readonly rendererFactory = inject(RendererFactory2);
    readonly #cursorService = inject(CursorService);
    private readonly renderer: Renderer2;

    private fps = 0;
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
    private rotationBaseAngle = 0;
    #isCursorOnLastVertex = false;

    constructor() {
        this.renderer = this.rendererFactory.createRenderer(null, null);

        this.#keyShortcutsService.registerShortcut(
            ["Escape"],
            () => {
                const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

                if (draftPolygon) {
                    console.log(draftPolygon);
                    this.#polygonsStoreService.removePolygonById(draftPolygon.id);
                }

                this.#drawModeService.finalizeAllTempElements();

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
            ["Backspace"],
            () => {
                const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;

                if (!selectedPolygon) {
                    return;
                }

                this.#drawModeService.finalizeAllTempElements();
                this.#polygonsStoreService.removePolygonById(selectedPolygon.id);
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
            this.#polygonsStoreService.updateElementById(editorState.draftPolygon.id, {
                type: CanvasElementTypes.Polygon,
            });
        }

        if (editorState.editorMode === "drawLine" && editorState.draftPolygon) {
            this.#polygonsStoreService.updateElementById(editorState.draftPolygon.id, {
                type: CanvasElementTypes.Line,
            });
        }

        this.#deselectElement();
        this.#isCursorOnLastVertex = false;
        this.#drawModeService.finalizeAllTempElements();
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
        const allPolygons: CanvasElement[] = this.#polygonsStoreService.selectAllPolygons;
        const canvasCoordinates = { x: startCanvasX, y: startCanvasY };
        let isOnSelectedPolygon: IsPointOnAnyElementByTypesFuncType | null = null;

        const isOnSomePolygon = isPointOnAnyElementByTypes(canvasCoordinates, allPolygons);

        if (selectedPolygon) {
            isOnSelectedPolygon = isPointOnAnyElementByTypes(canvasCoordinates, [selectedPolygon]);
        }

        if (isOnSomePolygon.element && isOnSomePolygon.element.type === CanvasElementTypes.RotateButton) {
            this.dragState = DragState.Rotate;
        } else if (isOnSelectedPolygon && isOnSelectedPolygon?.verticalsNumber !== null) {
            this.dragState = DragState.Vertex;
            this.draggedVertexIndex = isOnSelectedPolygon.verticalsNumber;
        } else if (isOnSelectedPolygon?.element) {
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
        const selectedElement = this.#canvasStateService.editorState.selectedPolygon;
        const outlineElement = this.#drawModeService.getTemporaryOutlinePolygon();

        if (this.dragState === DragState.Rotate && selectedElement && outlineElement) {
            // TODO: Сохранять угол поворота и потом задавать его для полигона обводки
            const outlineCenter = findRectangleCenter(outlineElement.vertices);

            this.rotationBaseAngle += calculateRotationAngle(coords.x, coords.y, outlineCenter.x, outlineCenter.y);

            const newRotatedCoord = rotateVertices(selectedElement.vertices, this.rotationBaseAngle);
            // const newRotatedCoordOutlineElement = rotateVertices(outlineElement.vertices, this.rotationBaseAngle);

            this.#polygonsStoreService.updateElementById(selectedElement.id, {
                vertices: newRotatedCoord,
            });

            // this.#polygonsStoreService.updateElementById(outlineElement.id, {
            //     vertices: newRotatedCoordOutlineElement,
            // });
            selectedElement.vertices = newRotatedCoord;

            this.#drawModeService.addOrUpdateTemporaryOutlinePolygonOnEdit(selectedElement, 15);
        }

        this.rotationBaseAngle = 0;

        // перемещение камеры canvas
        if (this.dragState === DragState.Canvas) {
            this.#canvasStateService.transformState.offsetX += coords.deltaX;
            this.#canvasStateService.transformState.offsetY += coords.deltaY;
        }

        if (this.dragState === DragState.Polygon && selectedElement) {
            const { x, y } = { x: this.startX + coords.x, y: this.startY + coords.y };
            const deltaX = x - this.startX;
            const deltaY = y - this.startY;

            selectedElement.vertices = selectedElement.vertices.map((v) => ({
                x: v.x + deltaX,
                y: v.y + deltaY,
            }));
            this.#polygonsStoreService.updateElementById(selectedElement.id, selectedElement);
            this.#drawModeService.addOrUpdateTemporaryOutlinePolygonOnEdit(selectedElement, 15);
            this.startX = x;
            this.startY = y;
        }

        if (this.dragState === DragState.Vertex && selectedElement && this.draggedVertexIndex !== null) {
            const vertexCoords = { x: this.startX + coords.x, y: this.startY + coords.y };
            const vdeltaX = vertexCoords.x - this.startX;
            const vdeltaY = vertexCoords.y - this.startY;

            selectedElement.vertices[this.draggedVertexIndex] = {
                x: selectedElement.vertices[this.draggedVertexIndex].x + vdeltaX,
                y: selectedElement.vertices[this.draggedVertexIndex].y + vdeltaY,
            };
            this.#polygonsStoreService.updateElementById(selectedElement.id, selectedElement);
            this.startX = vertexCoords.x;
            this.startY = vertexCoords.y;
            this.#drawModeService.addOrUpdateTemporaryOutlinePolygonOnEdit(selectedElement, 15);
        }

        this.#canvasRenderUtilsService.redrawCanvas();
        this.updateFPS();
    }

    private onPointerMoveNoDownKey(event: PointerEvent): void {
        const mode: EditorMode = this.#canvasStateService.editorState.editorMode;
        const cursorVertex = this.getCanvasCoordinates(event);
        const allPolygons: CanvasElement[] = this.#polygonsStoreService.selectAllPolygons;

        const isOnElement = isPointOnAnyElementByTypes(cursorVertex, allPolygons, 6);

        if (isOnElement.isOnElement) {
            if (isOnElement.element?.type === "rotateButton") {
                this.#cursorService.setCursor("grab");
            } else {
                this.#cursorService.setCursor("move");
            }
        } else {
            this.#cursorService.resetCursor();
        }

        if (mode === "drawPolygon") {
            const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

            if (draftPolygon && draftPolygon.vertices.length > 0) {
                const lastVertex = draftPolygon.vertices[draftPolygon.vertices.length - 1];

                this.#drawModeService.createOrUpdatePreviewLine(lastVertex, cursorVertex);

                const isOnVertex = findPointInPolygonVertex(cursorVertex, [draftPolygon.vertices[0]], 5);

                if (isOnVertex === 0 && draftPolygon.vertices.length > 2) {
                    this.#drawModeService.addTemporaryPolygon(draftPolygon);
                    this.#isCursorOnLastVertex = true;
                } else {
                    this.#drawModeService.removeTemporaryFillPolygon();
                    this.#isCursorOnLastVertex = false;
                }
            }
        }
    }

    private handleClick(event: PointerEvent): void {
        const mode = this.#canvasStateService.editorState.editorMode;
        const { x, y } = this.getCanvasCoordinates(event);

        if (mode === "drawPolygon" || mode === "drawLine") {
            const draftPolygon = this.#canvasStateService.editorState.draftPolygon;

            if (!draftPolygon) {
                const newPolygon = this.#polygonService.savePolygonData([{ x, y }], CanvasElementTypes.Line);

                newPolygon.state = "Selected";

                this.#canvasStateService.editorState.selectedPolygonId = newPolygon.id;
                this.#canvasStateService.editorState.draftPolygon = newPolygon;
                this.#canvasRenderUtilsService.redrawCanvas();

                return;
            }

            if (mode === "drawPolygon" && this.#isCursorOnLastVertex) {
                this.endDraw();

                return;
            }

            draftPolygon.vertices.push({ x, y });
            this.#polygonsStoreService.updateElementById(draftPolygon.id, draftPolygon);
            this.#canvasRenderUtilsService.redrawCanvas();

            return;
        }

        let polygonClicked = false;

        const allElements = this.#polygonsStoreService.selectAllPolygons;
        const isOnElementStatus = isPointOnAnyElementByTypes({ x, y }, allElements, 5);
        const clickedElement = isOnElementStatus.element;

        if (clickedElement && !isEditorUnEditType(clickedElement.type)) {
            polygonClicked = true;
            const prevId = this.#canvasStateService.editorState.selectedPolygonId;

            if (prevId === clickedElement.id) {
                this.#canvasStateService.updateEditorState({ editorMode: "viewMode" });
                clickedElement.state = "Normal";
                this.#polygonsStoreService.updateElementById(clickedElement.id, clickedElement);
                this.#canvasRenderUtilsService.redrawCanvas();
                this.#drawModeService.finalizeAllTempElements();

                return;
            }

            if (prevId) {
                const prevPolygon = this.#polygonsStoreService.getPolygonById(prevId);

                if (prevPolygon) {
                    prevPolygon.state = "Normal";
                    this.#polygonsStoreService.updateElementById(prevId, prevPolygon);
                }
            }

            this.#canvasStateService.updateEditorState({ editorMode: "selectMode" });
            this.#canvasStateService.editorState.selectedPolygonId = clickedElement.id;
            clickedElement.state = "Selected";
            this.#polygonsStoreService.updateElementById(clickedElement.id, clickedElement);
            this.#canvasRenderUtilsService.redrawCanvas();

            this.#drawModeService.addOrUpdateTemporaryOutlinePolygonOnEdit(clickedElement, 15);
            this.updateFPS();
        }

        if (!polygonClicked) {
            this.#drawModeService.finalizeAllTempElements();
            this.#deselectElement();
        }
    }

    #deselectElement(): void {
        const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId;

        if (prevPolygonId) {
            const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);

            if (prevPolygon) {
                prevPolygon.state = "Normal";
                this.#polygonsStoreService.updateElementById(prevPolygonId, prevPolygon);
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
}
