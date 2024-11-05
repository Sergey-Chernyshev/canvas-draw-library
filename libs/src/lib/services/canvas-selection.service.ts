// canvas-library/services/canvas-selection.service.ts

import { Injectable } from '@angular/core';
import { CanvasStateService, Point } from './canvas-state.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasSelectionService {
    constructor(private stateService: CanvasStateService) {}

    selectPolygon(x: number, y: number): void {
        this.stateService.selectedPolygonIndex = null;

        for (let index = 0; index < this.stateService.polygons.length; index++) {
            const polygon = this.stateService.polygons[index];
            if (this.isPointInPolygon(x, y, polygon)) {
                this.stateService.selectedPolygonIndex = index;
                break;
            }
        }
    }

    isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    getVertexAtPosition(x: number, y: number, polygon: Point[]): number | null {
        const radius = 5;
        for (let i = 0; i < polygon.length; i++) {
            const vertex = polygon[i];
            const dx = x - vertex.x;
            const dy = y - vertex.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
                return i;
            }
        }
        return null;
    }
}
