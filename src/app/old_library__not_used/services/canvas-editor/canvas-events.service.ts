import { isPointInCircle, isPointInPolygon } from '../utils/coordinates-utils.utils';
import { CanvasPolygon } from '../element/models/element.interface';
import { inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { CanvasStateService } from './canvas-state.service';
import { PolygonsStoreService } from '../element/polygons-store.service';
import { EditorState } from './models/canvas-editor.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasEventsService {
    readonly #canvasService = inject(CanvasService);
    readonly #rendererFactory = inject(RendererFactory2);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #polygonsStoreService = inject(PolygonsStoreService);
    #renderer: Renderer2 = this.#rendererFactory.createRenderer(null, null);

    private isDragging = false;
    private startX = 0;
    private startY = 0;
    private dragThreshold = 5; // Пороговое значение для определения движения


    initListeners(): void {
        const canvasRef = this.#canvasService.canvasRef?.nativeElement;
        if (!canvasRef) { return; }

        this.#renderer.listen(canvasRef, 'mousedown', (event: MouseEvent) => {
            this.isDragging = false;
            this.startX = event.clientX;
            this.startY = event.clientY;
        });

        this.#renderer.listen(canvasRef, 'mousemove', (event: MouseEvent) => {
            if (event.buttons === 1) { // Проверка нажатия левой кнопки мыши
                const dx = event.clientX - this.startX;
                const dy = event.clientY - this.startY;
                if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
                    this.isDragging = true;
                }
            }
        });

        // Слушаем события mouseup для завершения действия
        this.#renderer.listen(canvasRef, 'mouseup', (event: MouseEvent) => {
            if (!this.isDragging) {
                this.handleCanvasClick(event);
            }
            this.isDragging = false;
        });

        this.#renderer.listen(canvasRef, 'touchstart', (event: TouchEvent) => {
            if (event.touches.length === 1) {
                this.isDragging = false;
                this.startX = event.touches[0].clientX;
                this.startY = event.touches[0].clientY;
            }
        });

        this.#renderer.listen(canvasRef, 'touchmove', (event: TouchEvent) => {
            if (event.touches.length === 1) {
                const dx = event.touches[0].clientX - this.startX;
                const dy = event.touches[0].clientY - this.startY;
                if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
                    this.isDragging = true;
                }
            }
        });

        this.#renderer.listen(canvasRef, 'touchend', (event: TouchEvent) => {
            if (!this.isDragging) {
                this.handleCanvasClick(event);
            }
            this.isDragging = false;
        });
    }

    private handleCanvasClick(event: MouseEvent | TouchEvent): void {
        const { x, y } = this.getCanvasCoordinates(event);
        const canvasEditorState: EditorState = this.#canvasStateService.editorState
        this.#polygonsStoreService.selectAllPolygons.forEach((polygon: CanvasPolygon) => {
            if (canvasEditorState.stateValue) {
                const isClickInPolygon = isPointInPolygon({ x, y }, polygon.vertices);
                if (isClickInPolygon) {
                    const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId
                    console.log(prevPolygonId, polygon.id)
                    if (prevPolygonId === polygon.id){
                        this.#canvasStateService.editorState.stateValue = 'viewMode';
                        this.#canvasStateService.editorState.selectedPolygonId = null;
                        polygon.state = 'Normal';
                        this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                        return
                    }
                    if (prevPolygonId) {
                        const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);
                        if (prevPolygon) {
                            prevPolygon.state = 'Normal'
                            this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
                        }
                    }
                    console.log("dasdas")
                    this.#canvasStateService.editorState.stateValue = 'viewMode';
                    this.#canvasStateService.editorState.selectedPolygonId = polygon.id;
                    polygon.state = 'Selected'
                    this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                }

                // polygon.vertices.forEach((vertice: { x: number; y: number }) => {
                //     const result = isPointInCircle({ x, y }, vertice, 5);
                //     if (result) {
                //         console.log("Editor: ", polygon.id);
                //         const prevPolygonId = this.#canvasStateService.editorState.selectedPolygonId
                //         if (prevPolygonId) {
                //             const prevPolygon = this.#polygonsStoreService.getPolygonById(prevPolygonId);
                //             if (prevPolygon) {
                //                 prevPolygon.state = 0
                //                 this.#polygonsStoreService.updatePolygonById(prevPolygonId, prevPolygon);
                //             }
                //         }
                //         this.#canvasStateService.editorState.selectedPolygonId = polygon.id;
                //         polygon.state = 1;
                //         this.#polygonsStoreService.updatePolygonById(polygon.id, polygon);
                //     }
                // });
            }
        });

        console.log(`Координаты на канвасе: x=${x}, y=${y}`);
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
}
