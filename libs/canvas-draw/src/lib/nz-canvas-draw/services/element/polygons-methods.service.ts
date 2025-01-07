import { inject, Injectable } from "@angular/core";

import { isPointInPolygon } from "../utils";
import type { CanvasDotCoordinate, CanvasPolygon } from "./models";
import { PolygonsStoreService } from "./polygons-store.service";

@Injectable({
    providedIn: "root",
})
export class PolygonsMethodsService {
    readonly #polygonsStoreService = inject(PolygonsStoreService);

    selectAllPolygonsByCoordinates(coordinates: CanvasDotCoordinate, getAlone = false): CanvasPolygon[] {
        const allPolygons: CanvasPolygon[] = this.#polygonsStoreService.selectAllPolygons;

        if (getAlone) {
            const polygon = allPolygons.find((polygonEl: CanvasPolygon) =>
                isPointInPolygon(coordinates, polygonEl.vertices),
            );

            return polygon ? [polygon] : [];
        }

        return allPolygons.filter((polygon) => isPointInPolygon(coordinates, polygon.vertices));
    }
}
