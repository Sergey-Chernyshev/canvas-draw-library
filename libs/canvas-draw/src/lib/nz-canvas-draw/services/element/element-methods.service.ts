import { inject, Injectable } from "@angular/core";
import { Point } from "@nz/nz-canvas-draw";

import { isPointInPolygon } from "../utils";
import { ElementStoreService } from "./element-store.service";
import type { CanvasElement } from "./models";

@Injectable({
    providedIn: "root",
})
export class ElementMethodsService {
    readonly #polygonsStoreService = inject(ElementStoreService);

    selectAllPolygonsByCoordinates(coordinates: Point, getAlone = false): CanvasElement[] {
        const allPolygons: CanvasElement[] = this.#polygonsStoreService.selectAllPolygons;

        if (getAlone) {
            const polygon = allPolygons.find((polygonEl: CanvasElement) =>
                isPointInPolygon(coordinates, polygonEl.vertices),
            );

            return polygon ? [polygon] : [];
        }

        return allPolygons.filter((polygon) => isPointInPolygon(coordinates, polygon.vertices));
    }
}
