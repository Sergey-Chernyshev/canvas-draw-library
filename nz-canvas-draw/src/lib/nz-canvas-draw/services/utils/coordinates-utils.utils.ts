import { inject } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { PolygonsStoreService } from '../element/polygons-store.service';
import { CanvasStateService } from '../canvas-editor/canvas-state.service';
import { CanvasDotCoordinate } from '../element/models/element.interface';

/**
 * Проверяет, находится ли точка внутри окружности.
 * @param point Точка с координатами {x: number; y: number}.
 * @param center Центр окружности с координатами {x: number; y: number}.
 * @param radius Радиус окружности.
 * @returns true, если точка находится внутри или на границе окружности, иначе false.
 */
export function isPointInCircle(point: CanvasDotCoordinate, center: CanvasDotCoordinate, radius: number): boolean {
    const distanceSquared = (point.x - center.x) ** 2 + (point.y - center.y) ** 2;
    return distanceSquared <= radius ** 2;
}

export function findPointInPolygonVertex(
    point: CanvasDotCoordinate,
    vertices: CanvasDotCoordinate[],
    radius: number
): number | null {
    const radiusSquared = radius ** 2;

    for (let i = 0; i < vertices.length; i++) {
        const distanceSquared = (point.x - vertices[i].x) ** 2 + (point.y - vertices[i].y) ** 2;
        if (distanceSquared <= radiusSquared) {
            return i;
        }
    }

    return null;
}

/**
 * Проверяет, находится ли точка внутри полигона.
 * @param point Точка с координатами { x: number; y: number }.
 * @param vertices Массив вершин полигона, каждая вершина представлена как объект { x: number; y: number }.
 * @param includeBoundary Определяет, следует ли учитывать точки, находящиеся на границе (по умолчанию false).
 * @returns true, если точка находится внутри полигона (или на границе, если includeBoundary=true), иначе false.
 */
export function isPointInPolygon(
    point: CanvasDotCoordinate,
    vertices: Array<CanvasDotCoordinate>,
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



