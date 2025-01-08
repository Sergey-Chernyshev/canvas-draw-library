import { inject, Injectable } from "@angular/core";
import { CanvasRenderUtilsService, ElementService, Point } from "@nz/nz-canvas-draw";

import { CanvasElement, CanvasElementTypes, ElementStoreService } from "../../element";
import { minimumBoundingRectangle } from "../../utils";

@Injectable({ providedIn: "root" })
export class DrawModeService {
    previewLineId?: string;
    readonly #drawUtilsElements: string[] = [];
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #polygonService = inject(ElementService);
    readonly #polygonsStore = inject(ElementStoreService);
    private temporaryOutlinePolygonId: string | null = null;
    #temporaryPolygon: CanvasElement | null = null;

    /**
     * Создает или обновляет предварительную линию на канвасе.
     * @param startCoord Начальная точка линии.
     * @param endCoord Конечная точка линии.
     * @returns Обновленный или созданный полигон линии.
     */
    createOrUpdatePreviewLine(startCoord: Point, endCoord: Point): CanvasElement {
        if (!this.previewLineId) {
            const polygon = this.#polygonService.savePolygonData([startCoord, endCoord]);

            polygon.state = "Selected";
            this.#drawUtilsElements.push(polygon.id);
            this.previewLineId = polygon.id;
            this.#canvasRenderUtilsService.redrawCanvas();

            return polygon;
        }

        const polygon = this.#polygonsStore.getPolygonById(this.previewLineId);

        if (!polygon) {
            const newPolygon = this.#polygonService.savePolygonData([startCoord, endCoord]);

            newPolygon.state = "Selected";
            this.#drawUtilsElements.push(newPolygon.id);
            this.previewLineId = newPolygon.id;
            this.#canvasRenderUtilsService.redrawCanvas();

            return newPolygon;
        }

        polygon.vertices = [startCoord, endCoord];
        this.#polygonsStore.updateElementById(polygon.id, polygon);
        this.#canvasRenderUtilsService.redrawCanvas();

        return polygon;
    }

    /**
     * Завершает предварительную линию, удаляя её с канваса.
     */
    finalizePreviewLine(): void {
        if (this.previewLineId) {
            this.#polygonsStore.removePolygonById(this.previewLineId);
            this.#drawUtilsElements.splice(this.#drawUtilsElements.indexOf(this.previewLineId), 1);
            this.previewLineId = undefined;
            this.#canvasRenderUtilsService.redrawCanvas();
        }
    }

    /**
     * Удаляет временный ограничивающий прямоугольник.
     */
    finalizeTemporaryOutlinePolygonOnEdit(): void {
        if (this.temporaryOutlinePolygonId) {
            // Удаляем только временный ограничивающий прямоугольник
            this.#polygonsStore.removePolygonById(this.temporaryOutlinePolygonId);
            this.#drawUtilsElements.splice(this.#drawUtilsElements.indexOf(this.temporaryOutlinePolygonId), 1);
            this.temporaryOutlinePolygonId = null;
            this.#canvasRenderUtilsService.redrawCanvas();
        }
    }

    /**
     * Создаёт временный полигон.
     * @param polygon Полигон, который необходимо временно добавить.
     */
    addTemporaryPolygon(polygon: CanvasElement): void {
        if (!this.#temporaryPolygon) {
            this.#temporaryPolygon = this.#polygonService.savePolygonData(
                polygon.vertices,
                CanvasElementTypes.FillPolygon,
            );
            this.#drawUtilsElements.push(this.#temporaryPolygon.id);
            this.#canvasRenderUtilsService.redrawCanvas();
        }
    }

    /**
     * Удаляет временный полигон.
     */
    removeTemporaryFillPolygon(): void {
        if (this.#temporaryPolygon) {
            this.#polygonsStore.removePolygonById(this.#temporaryPolygon.id);
            this.#drawUtilsElements.splice(this.#drawUtilsElements.indexOf(this.#temporaryPolygon.id), 1);
            this.#temporaryPolygon = null;
            this.#canvasRenderUtilsService.redrawCanvas();
        }
    }

    /**
     * Создаёт или обновляет временный ограничивающий прямоугольник для переданного полигона.
     * @param targetPolygon Полигон, для которого нужно создать или обновить ограничивающий прямоугольник.
     * @param offset Смещение для расширения ограничивающего прямоугольника.
     * @returns Временный ограничивающий прямоугольник.
     */
    addOrUpdateTemporaryOutlinePolygonOnEdit(targetPolygon: CanvasElement, offset: number = 0): CanvasElement {
        const mbrVertices = minimumBoundingRectangle(targetPolygon.vertices, offset);

        if (!this.temporaryOutlinePolygonId) {
            const tempPolygon = this.#polygonService.savePolygonData(mbrVertices, CanvasElementTypes.OutlineElement);

            tempPolygon.state = "OutlineEditorUnselected";
            this.#drawUtilsElements.push(tempPolygon.id);
            this.temporaryOutlinePolygonId = tempPolygon.id;
            this.#canvasRenderUtilsService.redrawCanvas();

            return tempPolygon;
        }

        const existingTempPolygon = this.#polygonsStore.getPolygonById(this.temporaryOutlinePolygonId);

        if (!existingTempPolygon) {
            const tempPolygon = this.#polygonService.savePolygonData(mbrVertices, CanvasElementTypes.OutlineElement);

            tempPolygon.state = "OutlineEditorUnselected";
            this.#drawUtilsElements.push(tempPolygon.id);
            this.temporaryOutlinePolygonId = tempPolygon.id;
            this.#canvasRenderUtilsService.redrawCanvas();

            return tempPolygon;
        }

        existingTempPolygon.vertices = mbrVertices;
        this.#polygonsStore.updateElementById(existingTempPolygon.id, existingTempPolygon);
        this.#canvasRenderUtilsService.redrawCanvas();

        return existingTempPolygon;
    }

    /**
     * Завершает все временные элементы, удаляя их с canvas.
     */
    finalizeAllTempElements(): void {
        this.finalizeTemporaryOutlinePolygonOnEdit();
        this.finalizePreviewLine();
        this.removeTemporaryFillPolygon();
    }
}
