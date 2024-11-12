import { inject, Injectable } from '@angular/core';
import { CanvasPolygon } from './models/element.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasService } from '../canvas.service';
import { CanvasStateService } from '../canvas-editor/canvas-state.service';

@Injectable({
    providedIn: 'root'
})
export class PolygonsStoreService {
    readonly #canvasStateService = inject(CanvasStateService);
    #polygons: CanvasPolygon[] = [];
    #polygons$: BehaviorSubject<CanvasPolygon[]> = new BehaviorSubject<CanvasPolygon[]>(this.#polygons);

    get selectAllPolygons(): CanvasPolygon[] {
        return this.#polygons;
    }

    get selectAllPolygons$(): Observable<CanvasPolygon[]> {
        return this.#polygons$.asObservable();
    }

    addNewPolygon(polygon: CanvasPolygon): void {
        this.#polygons.push(polygon);
        this.#polygons$.next(this.#polygons);
    }

    updatePolygonById(polygonId: string, updatedPolygonData: Partial<CanvasPolygon>): void {
        const index = this.#polygons.findIndex(polygon => polygon.id === polygonId);
        if (index !== -1) {
            // Обновляем свойства найденного полигона
            this.#polygons[index] = {
                ...this.#polygons[index], ...updatedPolygonData
            };
            if(updatedPolygonData.state === 'Selected'){
                this.#canvasStateService.updateEditorState({selectedPolygon: this.#polygons[index]})
            }
            this.#polygons$.next(this.#polygons);
        } else {
            console.warn(`Polygon with id ${polygonId} not found`);
        }
    }

    getPolygonById(polygonId: string): CanvasPolygon | undefined {
        return this.#polygons.find(polygon => polygon.id === polygonId);
    }
}
