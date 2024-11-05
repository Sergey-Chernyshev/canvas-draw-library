// canvas-library/services/canvas-layer.service.ts

import { Injectable } from '@angular/core';
import { CanvasStateService } from './canvas-state.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasLayerService {
    constructor(public stateService: CanvasStateService) {}

    moveForward(index: number): void {
        if (index < this.stateService.polygons.length - 1) {
            [this.stateService.polygons[index], this.stateService.polygons[index + 1]] =
                [this.stateService.polygons[index + 1], this.stateService.polygons[index]];
            // Обновляем индекс выбранного полигона, если необходимо
            if (this.stateService.selectedPolygonIndex === index) {
                this.stateService.selectedPolygonIndex = index + 1;
            } else if (this.stateService.selectedPolygonIndex === index + 1) {
                this.stateService.selectedPolygonIndex = index;
            }
        }
    }

    moveBackward(index: number): void {
        if (index > 0) {
            [this.stateService.polygons[index], this.stateService.polygons[index - 1]] =
                [this.stateService.polygons[index - 1], this.stateService.polygons[index]];
            // Обновляем индекс выбранного полигона, если необходимо
            if (this.stateService.selectedPolygonIndex === index) {
                this.stateService.selectedPolygonIndex = index - 1;
            } else if (this.stateService.selectedPolygonIndex === index - 1) {
                this.stateService.selectedPolygonIndex = index;
            }
        }
    }

    hideLayer(index: number): void {
        // Для скрытия слоя можно установить флаг видимости или удалить из массива отрисовки
        // В данном случае предполагается, что скрытие выполняется через удаление из массива временно
        // Реализация зависит от требований
    }

    showLayer(index: number): void {
        // Аналогично hideLayer, можно реализовать показ слоя
    }
}
