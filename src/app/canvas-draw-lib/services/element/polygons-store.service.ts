import { Injectable } from '@angular/core';
import { CanvasPolygon } from './models/element.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PolygonsStoreService {
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
            // Уведомляем подписчиков о новом состоянии
            this.#polygons$.next(this.#polygons);
        } else {
            console.warn(`Polygon with id ${polygonId} not found`);
        }
    }

    getPolygonById(polygonId: string): CanvasPolygon | undefined {
        return this.#polygons.find(polygon => polygon.id === polygonId);
    }
}
