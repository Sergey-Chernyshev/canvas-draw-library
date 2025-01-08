import { inject, Injectable } from "@angular/core";
import { CanvasStateService } from "@nz/nz-canvas-draw";
import type { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";

import type { CanvasElement } from "./models";

@Injectable({
    providedIn: "root",
})
export class ElementStoreService {
    readonly #canvasStateService = inject(CanvasStateService);
    #polygons: CanvasElement[] = [];
    readonly #polygons$: BehaviorSubject<CanvasElement[]> = new BehaviorSubject<CanvasElement[]>(this.#polygons);

    get selectAllPolygons(): CanvasElement[] {
        return this.#polygons;
    }

    get selectAllPolygons$(): Observable<CanvasElement[]> {
        return this.#polygons$.asObservable();
    }

    addNewPolygon(polygon: CanvasElement): void {
        this.#polygons.push(polygon);
        this.#polygons$.next(this.#polygons);
    }

    clearStore(): void {
        this.#polygons = [];
        this.#polygons$.next(this.#polygons);
    }

    updateElementById(elementId: string, updatedPolygonData: Partial<CanvasElement>): void {
        const index = this.#polygons.findIndex((polygon) => polygon.id === elementId);

        if (index !== -1) {
            // Обновляем свойства найденного полигона
            this.#polygons[index] = {
                ...this.#polygons[index],
                ...updatedPolygonData,
            };

            if (updatedPolygonData.state === "Selected") {
                this.#canvasStateService.updateEditorState({
                    selectedPolygon: this.#polygons[index],
                });
            }

            this.#polygons$.next(this.#polygons);
        } else {
            console.warn(`Polygon with id ${elementId} not found`);
        }
    }

    getPolygonById(polygonId: string): CanvasElement | undefined {
        return this.#polygons.find((polygon) => polygon.id === polygonId);
    }

    removePolygonById(polygonId: string): void {
        const index = this.#polygons.findIndex((polygon) => polygon.id === polygonId);

        if (index !== -1) {
            this.#polygons.splice(index, 1);
            this.#polygons$.next(this.#polygons);
        } else {
            console.warn(`Polygon with id ${polygonId} not found`);
        }
    }
}
