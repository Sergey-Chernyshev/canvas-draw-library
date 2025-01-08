import { Point } from "@nz/nz-canvas-draw";

export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
    const angleRadians = (angleDegrees * Math.PI) / 180;

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    const rotatedX = center.x + dx * Math.cos(angleRadians) - dy * Math.sin(angleRadians);
    const rotatedY = center.y + dx * Math.sin(angleRadians) + dy * Math.cos(angleRadians);

    return { x: rotatedX, y: rotatedY };
}
