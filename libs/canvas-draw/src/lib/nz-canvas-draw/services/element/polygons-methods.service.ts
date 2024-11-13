import { inject, Injectable } from "@angular/core";
import { PolygonsStoreService } from "./polygons-store.service";
import type { CanvasDotCoordinate, CanvasPolygon } from "./models/element.interface";
import { isPointInPolygon } from "../utils/coordinates-utils.utils";

@Injectable({
    providedIn: "root",
})
export class PolygonsMethodsService {
    readonly #polygonsStoreService = inject(PolygonsStoreService);

    selectAllPolygonsByCoordinates(coordinates: CanvasDotCoordinate, getAlone = false): CanvasPolygon[] {
        const allPolygons: CanvasPolygon[] = this.#polygonsStoreService.selectAllPolygons;

        if (getAlone) {
            const polygon = allPolygons.find((polygon) => isPointInPolygon(coordinates, polygon.vertices));
            return polygon ? [polygon] : [];
        }

        return allPolygons.filter((polygon) => isPointInPolygon(coordinates, polygon.vertices));
    }
}
