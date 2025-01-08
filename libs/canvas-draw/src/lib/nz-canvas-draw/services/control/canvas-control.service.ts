import type { ElementRef, Renderer2 } from "@angular/core";
import { inject, Injectable, RendererFactory2 } from "@angular/core";

import { CanvasStateService, EditorMode } from "../canvas-editor";
import { DrawModeService } from "../canvas-editor/draw-mode/draw-mode.service";
import { ElementStoreService } from "../element";
import { generateUniqueId } from "../utils";

@Injectable({ providedIn: "root" })
export class CanvasControlService {
    readonly #rendererFactory = inject(RendererFactory2);
    readonly #polygonsStoreService = inject(ElementStoreService);
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #drawModeService = inject(DrawModeService);

    readonly #renderer: Renderer2 = this.#rendererFactory.createRenderer(null, null);

    readonly #offsetX = 20;
    readonly #offsetY = 30;

    setupCanvasEditorMenu(menuRef: ElementRef<HTMLDivElement>): void {
        const menu = menuRef.nativeElement;
        const buttons = [
            {
                label: "Линия",
                action: () => {
                    this.#canvasStateService.updateEditorState({ editorMode: EditorMode.DrawLine });
                },
            },
            {
                label: "Полигон",
                action: () => {
                    this.#canvasStateService.updateEditorState({ editorMode: EditorMode.DrawPolygon });
                },
            },
            {
                label: "Круг",
                action: () => {
                    this.#canvasStateService.updateEditorState({ editorMode: EditorMode.DrawCircle });
                },
            },
            {
                label: "Текст",
                action: () => {
                    this.#canvasStateService.updateEditorState({ editorMode: EditorMode.DrawText });
                },
            },
            {
                label: "Очистить холст",
                action: () => this.#clearCanvas(),
            },
            {
                label: "Дублировать",
                action: () => {
                    this.#copyPolygonOnCanvas();
                },
            },
            {
                label: "Дублировать тест 10к",
                action: () => {
                    for (let i = 0; i < 10001; i++) {
                        this.#copyPolygonOnCanvas();
                    }
                },
            },
            {
                label: "Удалить",
                action: () => this.#deletePolygonOnCanvas(),
            },
        ];

        buttons.forEach((button) => {
            const btn = this.#renderer.createElement("button");
            const text = this.#renderer.createText(button.label);

            this.#renderer.appendChild(btn, text);
            this.#renderer.listen(btn, "click", button.action);

            // Добавление стилей кнопки
            this.#renderer.setStyle(btn, "margin", "5px");
            this.#renderer.setStyle(btn, "padding", "8px 12px");
            this.#renderer.setStyle(btn, "background-color", "#007bff");
            this.#renderer.setStyle(btn, "color", "#fff");
            this.#renderer.setStyle(btn, "border", "none");
            this.#renderer.setStyle(btn, "border-radius", "4px");
            this.#renderer.setStyle(btn, "cursor", "pointer");

            this.#renderer.appendChild(menu, btn);
        });
    }

    #clearCanvas(): void {
        this.#polygonsStoreService.clearStore();
    }

    #deletePolygonOnCanvas(): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;

        if (!selectedPolygon) {
            return;
        }

        this.#polygonsStoreService.removePolygonById(selectedPolygon.id);
        this.#drawModeService.finalizeAllTempElements();
    }

    #copyPolygonOnCanvas(): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;

        if (!selectedPolygon) {
            return;
        }

        const newPolygon = {
            ...selectedPolygon,
            id: generateUniqueId(),
            vertices: selectedPolygon.vertices.map((vertex) => ({
                x: vertex.x + this.#offsetX,
                y: vertex.y + this.#offsetY,
            })),
        };

        this.#polygonsStoreService.updateElementById(selectedPolygon.id, {
            state: "Normal",
        });
        this.#polygonsStoreService.addNewPolygon(newPolygon);

        this.#canvasStateService.updateEditorState({
            selectedPolygon: newPolygon,
            selectedPolygonId: newPolygon.id,
        });
    }
}
