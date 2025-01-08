import { Point } from "@nz/nz-canvas-draw";

import type { CanvasElement } from "../element";
import { isEditorUnEditType } from ".";

/**
 * Проверяет, находится ли точка внутри окружности.
 * @param point Точка с координатами {x: number; y: number}.
 * @param center Центр окружности с координатами {x: number; y: number}.
 * @param radius Радиус окружности.
 * @returns true, если точка находится внутри или на границе окружности, иначе false.
 */
export function isPointInCircle(point: Point, center: Point, radius: number): boolean {
    const distanceSquared = (point.x - center.x) ** 2 + (point.y - center.y) ** 2;

    return distanceSquared <= radius ** 2;
}

export function findPointInPolygonVertex(point: Point, vertices: Point[], radius: number): number | null {
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
    b: {
        x: number;
        y: number;
    },
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
    cursor: Point,
    polygons: CanvasElement[],
    radius: number,
    skipClosingEdge: boolean = false,
): boolean {
    for (const polygon of polygons) {
        if (isEditorUnEditType(polygon.type)) {
            continue;
        }

        const verts = polygon.vertices;
        const len = verts.length;

        const end = skipClosingEdge ? len - 1 : len;

        for (let i = 0; i < end; i++) {
            const start = verts[i];
            const endPoint = verts[(i + 1) % len];

            if (skipClosingEdge && i + 1 === len) {
                continue;
            }

            if (isPointOnSegment(cursor, start, endPoint, radius)) {
                return true;
            }
        }
    }

    return false;
}

export type IsPointOnAnyElementByTypesFuncType = {
    isOnElement: boolean;
    element: CanvasElement | null;
    isOnBorder: boolean;
    isInsideElement: boolean;
    verticalsNumber: number | null;
};

export function isPointOnAnyElementByTypes(
    point: Point,
    elements: CanvasElement[],
    radius: number = 15,
): IsPointOnAnyElementByTypesFuncType {
    for (const element of elements) {
        const isPointInOneOfVertices = findPointInPolygonVertex(point, element.vertices, radius);
        const isPointOnBorder = isCursorOnAnyBoundary(point, [element], radius);
        const isPointInsideElement = isPointInPolygon(point, element.vertices);

        switch (element.type) {
            case "polygon": {
                if (isPointOnBorder || isPointInsideElement) {
                    return {
                        isOnElement: true,
                        element,
                        isOnBorder: isPointOnBorder,
                        isInsideElement: isPointInsideElement,
                        verticalsNumber: isPointInOneOfVertices,
                    };
                }

                break;
            }
            case "line": {
                const isPointOnBorder = isCursorOnAnyBoundary(point, [element], radius);

                if (isPointOnBorder) {
                    return {
                        isOnElement: true,
                        element,
                        isOnBorder: isPointOnBorder,
                        isInsideElement: false,
                        verticalsNumber: isPointInOneOfVertices,
                    };
                }

                break;
            }
            case "rotateButton": {
                if (isPointInOneOfVertices !== null) {
                    return {
                        isOnElement: true,
                        element,
                        isOnBorder: true,
                        isInsideElement: true,
                        verticalsNumber: null,
                    };
                }

                break;
            }
            default: {
                break;
            }
        }
    }

    return {
        isOnElement: false,
        element: null,
        isOnBorder: false,
        isInsideElement: false,
        verticalsNumber: null,
    };
}

/**
 * Проверяет, находится ли точка внутри полигона.
 * @param point Точка с координатами { x: number; y: number }.
 * @param vertices Массив вершин полигона, каждая вершина представлена как объект {x: number; y: number }.
 * @returns true, если точка находится внутри полигона, иначе false.
 */
export function isPointInPolygon(point: Point, vertices: Point[]): boolean {
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

// Функция для построения выпуклой оболочки (Алгоритм Монтоны Чейн)
export function convexHull(points: Point[]): Point[] {
    if (points.length <= 1) {
        return points.slice();
    }

    const sorted = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

    const lower: Point[] = [];

    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }

        lower.push(p);
    }

    const upper: Point[] = [];

    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];

        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }

        upper.push(p);
    }

    lower.pop();
    upper.pop();

    return lower.concat(upper);
}

export function cross(o: Point, a: Point, b: Point): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function minimumBoundingRectangle(points: Point[], offset: number = 0): Point[] {
    if (points.length === 0) {
        throw new Error("Массив точек пуст.");
    }

    if (points.length === 1) {
        return [
            { x: points[0].x - offset, y: points[0].y - offset },
            {
                x: points[0].x + offset,
                y: points[0].y - offset,
            },
            { x: points[0].x + offset, y: points[0].y + offset },
            { x: points[0].x - offset, y: points[0].y + offset },
        ];
    }

    const hull = convexHull(points);
    const n = hull.length;

    if (n === 1) {
        const p = hull[0];

        return [
            { x: p.x - offset, y: p.y - offset },
            { x: p.x + offset, y: p.y - offset },
            {
                x: p.x + offset,
                y: p.y + offset,
            },
            { x: p.x - offset, y: p.y + offset },
        ];
    }

    if (n === 2) {
        const p1 = hull[0];
        const p2 = hull[1];
        const minX = Math.min(p1.x, p2.x) - offset;
        const maxX = Math.max(p1.x, p2.x) + offset;
        const minY = Math.min(p1.y, p2.y) - offset;
        const maxY = Math.max(p1.y, p2.y) + offset;

        return [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
        ];
    }

    let minX = hull[0].x;
    let maxX = hull[0].x;
    let minY = hull[0].y;
    let maxY = hull[0].y;

    for (const p of hull) {
        if (p.x < minX) {
            minX = p.x;
        }

        if (p.x > maxX) {
            maxX = p.x;
        }

        if (p.y < minY) {
            minY = p.y;
        }

        if (p.y > maxY) {
            maxY = p.y;
        }
    }

    minX -= offset;
    maxX += offset;
    minY -= offset;
    maxY += offset;

    return [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
    ];
}

const SENSITIVITY = 10;
let previousAngle: number | null = null;

export function calculateRotationAngle(currentX: number, currentY: number, centerX: number, centerY: number): number {
    const deltaX = currentX - centerX;
    const deltaY = currentY - centerY;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const angleDegrees = angleRadians * (180 / Math.PI);

    if (previousAngle === null) {
        previousAngle = angleDegrees;

        return 0;
    }

    let angleChange = angleDegrees - previousAngle;

    previousAngle = angleDegrees;

    angleChange *= SENSITIVITY;

    return angleChange;
}

/**
 * Вычисляет конвексную оболочку для набора точек с использованием алгоритма Andrew's Monotone Chain.
 *
 * @param points - Массив точек, для которых вычисляется конвексная оболочка.
 * @returns Массив точек, представляющих конвексную оболочку в порядке обхода.
 */
export function computeConvexHull(points: Point[]): Point[] {
    if (points.length <= 1) {
        return points.slice();
    }

    // Сортируем точки сначала по X, затем по Y
    const sortedPoints = points.slice().sort((a, b) => {
        return a.x === b.x ? a.y - b.y : a.x - b.x;
    });

    const lower: Point[] = [];

    for (const p of sortedPoints) {
        while (lower.length >= 2 && crossVectors(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }

        lower.push(p);
    }

    const upper: Point[] = [];

    for (let i = sortedPoints.length - 1; i >= 0; i--) {
        const p = sortedPoints[i];

        while (upper.length >= 2 && crossVectors(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }

        upper.push(p);
    }

    // Удаляем последний элемент каждого списка (они дублируются)
    lower.pop();
    upper.pop();

    // Объединяем нижнюю и верхнюю оболочки
    return lower.concat(upper);
}

/**
 * Вычисляет произведение векторов AB и AC.
 *
 * @param A - Первая точка.
 * @param B - Вторая точка.
 * @param C - Третья точка.
 * @returns Произведение векторов AB и AC.
 */
export function crossVectors(A: Point, B: Point, C: Point): number {
    const ABx = B.x - A.x;
    const ABy = B.y - A.y;
    const ACx = C.x - A.x;
    const ACy = C.y - A.y;

    return ABx * ACy - ABy * ACx;
}

/**
 * Вычисляет центр прямоугольника.
 *
 * @param vertices - Массив из четырёх точек, представляющих вершины прямоугольника.
 * @returns Точка, представляющая центр прямоугольника.
 */
export function findRectangleCenter(vertices: Point[]): Point {
    if (vertices.length !== 4) {
        throw new Error("Для вычисления центра необходимо передать ровно 4 вершины.");
    }

    const centerX = (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4;
    const centerY = (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4;

    return { x: centerX, y: centerY };
}
