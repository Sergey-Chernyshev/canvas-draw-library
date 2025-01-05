import { inject, Injectable } from "@angular/core";
import { CanvasRenderUtilsService, CanvasStateService, Point, PolygonsService } from "@nz/nz-canvas-draw";

import { CanvasPolygon, CanvasPolygonTypes } from "../../element/models/element.interface";
import { PolygonsStoreService } from "../../element/polygons-store.service";

@Injectable({ providedIn: "root" })
export class DrawModeService {
    readonly #drawUtilsElements: string[] = [];
    readonly #canvasStateService = inject(CanvasStateService);
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #polygonService = inject(PolygonsService);
    readonly #polygonsStore = inject(PolygonsStoreService);
    #temporaryPolygon: CanvasPolygon | null = null;
    previewLineId?: string;

    createOrUpdatePreviewLine(startCoord: Point, endCoord: Point): CanvasPolygon {
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
        this.#polygonsStore.updatePolygonById(polygon.id, polygon);
        this.#canvasRenderUtilsService.redrawCanvas();

        return polygon;
    }

    finalizePreviewLine(): void {
        if (this.previewLineId) {
            this.previewLineId = undefined;
            this.#drawUtilsElements.forEach((element) => {
                this.#polygonsStore.removePolygonById(element);
            });
            this.#canvasRenderUtilsService.redrawCanvas();
        }
    }

    addTemporaryPolygon(polygon: CanvasPolygon): void {
        if (!this.#temporaryPolygon) {
            this.#temporaryPolygon = this.#polygonService.savePolygonData(
                polygon.vertices,
                CanvasPolygonTypes.FillPolygon,
            );
        }
    }

    removeTemporaryPolygon(): void {
        if (this.#temporaryPolygon) {
            this.#polygonsStore.removePolygonById(this.#temporaryPolygon.id);
            this.#temporaryPolygon = null;
        }
    }
}
