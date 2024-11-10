import { inject } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { PolygonsStoreService } from '../element/polygons-store.service';
import { CanvasStateService } from '../canvas-editor/canvas-state.service';

/**
 * Проверяет, находится ли точка внутри окружности.
 * @param point Точка с координатами {x: number; y: number}.
 * @param center Центр окружности с координатами {x: number; y: number}.
 * @param radius Радиус окружности.
 * @returns true, если точка находится внутри или на границе окружности, иначе false.
 */
export function isPointInCircle(point: { x: number; y: number }, center: { x: number; y: number }, radius: number): boolean {
    const distanceSquared = (point.x - center.x) ** 2 + (point.y - center.y) ** 2;
    return distanceSquared <= radius ** 2;
}

/**
 * Проверяет, находится ли точка внутри полигона.
 * @param point Точка с координатами { x: number; y: number }.
 * @param vertices Массив вершин полигона, каждая вершина представлена как объект { x: number; y: number }.
 * @param includeBoundary Определяет, следует ли учитывать точки, находящиеся на границе (по умолчанию false).
 * @returns true, если точка находится внутри полигона (или на границе, если includeBoundary=true), иначе false.
 */
export function isPointInPolygon(
    point: { x: number; y: number },
    vertices: Array<{ x: number; y: number }>,
): boolean {
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;

        // Проверка на пересечение для алгоритма лучевого пересечения
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}



