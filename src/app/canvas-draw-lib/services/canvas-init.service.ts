import { ElementRef, inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { PolygonsStoreService } from './element/polygons-store.service';
import { CanvasStateService } from './canvas-editor/canvas-state.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasInitService {
    #rendererFactory = inject(RendererFactory2)
    #polygonsStoreService = inject(PolygonsStoreService);
    #canvasStateService = inject(CanvasStateService);

    #renderer: Renderer2 = this.#rendererFactory.createRenderer(null, null);

    readonly #offsetX = 20;
    readonly #offsetY = 30;

    initCanvas(){


    }


    setupCanvasEditorMenu(menuRef: ElementRef<HTMLDivElement>): void {
        const menu = menuRef.nativeElement
        // Создаем дефолтные кнопки
        const buttons = [
            { label: 'Круг', action: () => this.#addCircle() },
            { label: 'Очистить холст', action: () => this.#clearCanvas() },
            { label: 'Дублировать', action: () => this.#copyPolygonOnCanvas() },
            { label: 'Удалить', action: () => this.#deletePolygonOnCanvas() }

        ];

        buttons.forEach(button => {
            const btn = this.#renderer.createElement('button');
            const text = this.#renderer.createText(button.label);

            this.#renderer.appendChild(btn, text);
            this.#renderer.listen(btn, 'click', button.action);

            // Добавление стилей кнопки
            this.#renderer.setStyle(btn, 'margin', '5px');
            this.#renderer.setStyle(btn, 'padding', '8px 12px');
            this.#renderer.setStyle(btn, 'background-color', '#007bff');
            this.#renderer.setStyle(btn, 'color', '#fff');
            this.#renderer.setStyle(btn, 'border', 'none');
            this.#renderer.setStyle(btn, 'border-radius', '4px');
            this.#renderer.setStyle(btn, 'cursor', 'pointer');

            this.#renderer.appendChild(menu, btn);
        });
    }

    #addCircle(): void {
        console.log('Добавить круг');
    }

    #clearCanvas(): void {
        console.log('Очистить канвас');
        this.#polygonsStoreService.clearStore()
    }

    #deletePolygonOnCanvas(): void {
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;
        if (!selectedPolygon) return;
        this.#polygonsStoreService.removePolygonById(selectedPolygon.id)
    }

    #copyPolygonOnCanvas(): void {
        console.log('Дублировать элемент');
        const selectedPolygon = this.#canvasStateService.editorState.selectedPolygon;
        if (!selectedPolygon) return;

        const newPolygon = {
            ...selectedPolygon,
            id: this.#generateUniqueId(),
            vertices: selectedPolygon.vertices.map(vertex => ({
                x: vertex.x + this.#offsetX,
                y: vertex.y + this.#offsetY
            }))
        };
        this.#polygonsStoreService.updatePolygonById(selectedPolygon.id, {state: 'Normal'})
        this.#polygonsStoreService.addNewPolygon(newPolygon);

        this.#canvasStateService.updateEditorState({ selectedPolygon: newPolygon, selectedPolygonId: newPolygon.id });
    }


    #generateUniqueId(): string {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

}
