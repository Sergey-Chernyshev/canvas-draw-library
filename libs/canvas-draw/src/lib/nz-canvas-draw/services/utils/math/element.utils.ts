import { Point } from "@nz/nz-canvas-draw";

import { CanvasElement } from "../../element";
import { computeConvexHull } from "../coordinates-utils.utils";
import { rotatePoint } from "./point.utils";

export function rotateVertices(vertices: Point[], angleDegrees: number): Point[] {
    const centerX = vertices.reduce((sum: number, v: Point) => sum + v.x, 0) / vertices.length;
    const centerY = vertices.reduce((sum: number, v: Point) => sum + v.y, 0) / vertices.length;
    const center = { x: centerX, y: centerY };

    return vertices.map((vertex: Point) => rotatePoint(vertex, center, angleDegrees));
}

/**
 * Вычисляет центроид (геометрический центр) многоугольника.
 *
 * @param polygon - Массив точек, представляющих многоугольник (конвексную оболочку).
 * @returns Точка, представляющая центроид многоугольника.
 */
export function computeCentroid(polygon: Point[]): Point {
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    const n = polygon.length;

    for (let i = 0; i < n; i++) {
        const current = polygon[i];
        const next = polygon[(i + 1) % n];
        const crossProduct = current.x * next.y - next.x * current.y;

        area += crossProduct;
        centroidX += (current.x + next.x) * crossProduct;
        centroidY += (current.y + next.y) * crossProduct;
    }

    area /= 2;

    if (area === 0) {
        const sum = polygon.reduce(
            (acc, point) => ({
                x: acc.x + point.x,
                y: acc.y + point.y,
            }),
            { x: 0, y: 0 },
        );

        return {
            x: sum.x / polygon.length,
            y: sum.y / polygon.length,
        };
    }

    centroidX /= 6 * area;
    centroidY /= 6 * area;

    return { x: centroidX, y: centroidY };
}

/**
 * Вычисляет центр полигона на основе его конвексной оболочки.
 *
 * @param polygon - CanvasElement, представляющий полигон.
 * @returns Точка, представляющая центр полигона.
 */
export function calculatePolygonCenter(polygon: CanvasElement): Point {
    if (!polygon.vertices || polygon.vertices.length === 0) {
        throw new Error("Полигон не содержит вершин.");
    }

    const convexHull = computeConvexHull(polygon.vertices);

    return computeCentroid(convexHull);
}
