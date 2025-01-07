import type { CanvasDotCoordinate, CanvasPolygon } from "../element/models/element.interface";

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
    radius: number,
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

export function isPointOnSegment(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
    r: number,
): boolean {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const abLen2 = abx * abx + aby * aby;

    if (!abLen2) {
        return apx * apx + apy * apy <= r * r;
    }

    let t = (apx * abx + apy * aby) / abLen2;

    if (t < 0) {
        t = 0;
    }

    if (t > 1) {
        t = 1;
    }

    const projx = a.x + t * abx;
    const projy = a.y + t * aby;
    const dx = p.x - projx;
    const dy = p.y - projy;

    return dx * dx + dy * dy <= r * r;
}

export function isCursorOnAnyBoundary(
    cursor: { x: number; y: number },
    polygons: CanvasPolygon[],
    radius: number,
): boolean {
    for (const polygon of polygons) {
        const verts = polygon.vertices;

        for (let i = 0; i < verts.length; i++) {
            const start = verts[i];
            const end = verts[(i + 1) % verts.length];

            if (isPointOnSegment(cursor, start, end, radius)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Проверяет, находится ли точка внутри полигона.
 * @param point Точка с координатами { x: number; y: number }.
 * @param vertices Массив вершин полигона, каждая вершина представлена как объект {x: number; y: number }.
 * @returns true, если точка находится внутри полигона (или на границе, если includeBoundary=true), иначе false.
 */
export function isPointInPolygon(point: CanvasDotCoordinate, vertices: CanvasDotCoordinate[]): boolean {
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x;
        const yi = vertices[i].y;
        const xj = vertices[j].x;
        const yj = vertices[j].y;

        // Проверка на пересечение для алгоритма лучевого пересечения
        const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}
