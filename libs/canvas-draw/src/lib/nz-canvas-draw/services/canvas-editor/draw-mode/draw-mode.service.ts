import { inject, Injectable } from "@angular/core";
import { CanvasRenderUtilsService, ElementService, Point } from "@nz/nz-canvas-draw";

import { CanvasElement, CanvasElementTypes, ElementStoreService } from "../../element";
import { minimumBoundingRectangle } from "../../utils";

@Injectable({ providedIn: "root" })
export class DrawModeService {
    previewLineId?: string;
    readonly #tempElements: string[] = [];
    readonly #canvasRenderUtilsService = inject(CanvasRenderUtilsService);
    readonly #polygonService = inject(ElementService);
    readonly #polygonsStore = inject(ElementStoreService);
    private temporaryOutlinePolygon: CanvasElement | null = null;
    #temporaryPolygon: CanvasElement | null = null;
    private rotateButtonId: string | null = null;

    getTemporaryOutlinePolygon(): CanvasElement | null {
        return this.temporaryOutlinePolygon;
    }

    createOrUpdatePreviewLine(startCoord: Point, endCoord: Point): CanvasElement {
        if (!this.previewLineId) {
            const polygon = this.#polygonService.savePolygonData([startCoord, endCoord]);

            polygon.state = "Selected";
            this.#tempElements.push(polygon.id);
            this.previewLineId = polygon.id;

            return polygon;
        }

        const polygon = this.#polygonsStore.getPolygonById(this.previewLineId);

        if (!polygon) {
            const newPolygon = this.#polygonService.savePolygonData([startCoord, endCoord]);

            newPolygon.state = "Selected";
            this.#tempElements.push(newPolygon.id);
            this.previewLineId = newPolygon.id;

            return newPolygon;
        }

        polygon.vertices = [startCoord, endCoord];
        this.#polygonsStore.updateElementById(polygon.id, polygon);

        return polygon;
    }

    finalizePreviewLine(): void {
        if (this.previewLineId) {
            this.#polygonsStore.removePolygonById(this.previewLineId);
            this.#tempElements.splice(this.#tempElements.indexOf(this.previewLineId), 1);
            this.previewLineId = undefined;
        }
    }

    finalizeTemporaryOutlinePolygonOnEdit(): void {
        if (this.temporaryOutlinePolygon) {
            this.#polygonsStore.removePolygonById(this.temporaryOutlinePolygon.id);
            this.#tempElements.splice(this.#tempElements.indexOf(this.temporaryOutlinePolygon.id), 1);
            this.temporaryOutlinePolygon = null;
        }

        if (this.rotateButtonId) {
            this.#polygonsStore.removePolygonById(this.rotateButtonId);
            this.#tempElements.splice(this.#tempElements.indexOf(this.rotateButtonId), 1);
            this.rotateButtonId = null;
        }
    }

    addTemporaryPolygon(polygon: CanvasElement): void {
        if (!this.#temporaryPolygon) {
            this.#temporaryPolygon = this.#polygonService.savePolygonData(
                polygon.vertices,
                CanvasElementTypes.FillPolygon,
            );
            this.#tempElements.push(this.#temporaryPolygon.id);
        }
    }

    removeTemporaryFillPolygon(): void {
        if (this.#temporaryPolygon) {
            this.#polygonsStore.removePolygonById(this.#temporaryPolygon.id);
            this.#tempElements.splice(this.#tempElements.indexOf(this.#temporaryPolygon.id), 1);
            this.#temporaryPolygon = null;
        }
    }

    addOrUpdateTemporaryOutlinePolygonOnEdit(targetPolygon: CanvasElement, offset: number = 0): CanvasElement {
        const mbrVertices = minimumBoundingRectangle(targetPolygon.vertices, offset);

        if (!this.temporaryOutlinePolygon) {
            const tempPolygon = this.#polygonService.savePolygonData(mbrVertices, CanvasElementTypes.OutlineElement);

            tempPolygon.state = "OutlineEditorUnselected";
            this.#tempElements.push(tempPolygon.id);
            this.temporaryOutlinePolygon = tempPolygon;
            this.addOrUpdateRotateButton(tempPolygon);

            return tempPolygon;
        }

        const existingTempPolygon = this.#polygonsStore.getPolygonById(this.temporaryOutlinePolygon.id);

        if (!existingTempPolygon) {
            const tempPolygon = this.#polygonService.savePolygonData(mbrVertices, CanvasElementTypes.OutlineElement);

            tempPolygon.state = "OutlineEditorUnselected";
            this.#tempElements.push(tempPolygon.id);
            this.temporaryOutlinePolygon = tempPolygon;
            this.addOrUpdateRotateButton(tempPolygon);

            return tempPolygon;
        }

        existingTempPolygon.vertices = mbrVertices;
        this.addOrUpdateRotateButton(existingTempPolygon);
        this.#polygonsStore.updateElementById(existingTempPolygon.id, existingTempPolygon);

        return existingTempPolygon;
    }

    private addOrUpdateRotateButton(outlinePolygon: CanvasElement): void {
        const topVertices = outlinePolygon.vertices.sort((a, b) => a.y - b.y).slice(0, 2);
        const cx = (topVertices[0].x + topVertices[1].x) / 2;
        const cy = Math.min(topVertices[0].y, topVertices[1].y) - 20;
        const radius = 5;

        if (!this.rotateButtonId) {
            const circlePolygon = this.#polygonService.savePolygonData(
                [{ x: cx, y: cy }],
                CanvasElementTypes.RotateButton,
            );

            circlePolygon.center = { x: cx, y: cy };
            circlePolygon.radius = radius;
            circlePolygon.startAngle = 0;
            circlePolygon.endAngle = 2 * Math.PI;
            circlePolygon.counterclockwise = false;
            circlePolygon.state = "rotateButton";

            this.#tempElements.push(circlePolygon.id);
            this.rotateButtonId = circlePolygon.id;
        }

        const existingCircle = this.#polygonsStore.getPolygonById(this.rotateButtonId);

        if (!existingCircle) {
            const circlePolygon = this.#polygonService.savePolygonData(
                [{ x: cx, y: cy }],
                CanvasElementTypes.RotateButton,
            );

            circlePolygon.center = { x: cx, y: cy };
            circlePolygon.radius = radius;
            circlePolygon.startAngle = 0;
            circlePolygon.endAngle = 2 * Math.PI;
            circlePolygon.counterclockwise = false;
            circlePolygon.state = "rotateButton";

            this.#tempElements.push(circlePolygon.id);
            this.rotateButtonId = circlePolygon.id;
            // this.#canvasRenderUtilsService.redrawCanvas();

            return;
        }

        existingCircle.center = { x: cx, y: cy };
        existingCircle.vertices = [{ x: cx, y: cy }];

        this.#polygonsStore.updateElementById(existingCircle.id, existingCircle);
    }

    finalizeAllTempElements(): void {
        this.finalizeTemporaryOutlinePolygonOnEdit();
        this.finalizePreviewLine();
        this.removeTemporaryFillPolygon();
    }
}
