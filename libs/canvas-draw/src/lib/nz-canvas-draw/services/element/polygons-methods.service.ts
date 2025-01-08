import { inject, Injectable } from "@angular/core";
import { Point } from "@nz/nz-canvas-draw";

import { isPointInPolygon } from "../utils";
import type { CanvasElement } from "./models";
import { PolygonsStoreService } from "./polygons-store.service";

@Injectable({
    providedIn: "root",
})
export class PolygonsMethodsService {
    readonly #polygonsStoreService = inject(PolygonsStoreService);

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
