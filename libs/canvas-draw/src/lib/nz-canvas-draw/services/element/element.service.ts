import { inject, Injectable } from "@angular/core";

import { CanvasService } from "../canvas.service";
import { Point } from "../canvas-editor";
import { generateUniqueId, rotateVertices } from "../utils";
import { BASE_STYLE, ELEMENTS_STYLE_CONFIG } from "./common-styles";
import { ElementStoreService } from "./element-store.service";
import {
    CanvasElement,
    CanvasElementEditorUnEditTypes,
    CanvasElementStyle,
    CanvasElementTypes,
    CircleElement,
} from "./models";

@Injectable({
    providedIn: "root",
})
export class ElementService {
    readonly #canvasService = inject(CanvasService);
    readonly #polygonStoreService = inject(ElementStoreService);

    /**
     * Рисует тестовый прямоугольник на канвасе.
     * @param vertices Массив координат вершин прямоугольника.
     */
    drawTestPolygon(vertices: Array<{ x: number; y: number }>): void {
        const ctx = this.#canvasService.ctx;

        if (!ctx) {
            throw new Error("Canvas context is not available");
        }

        if (vertices.length < 3) {
            console.error("Прямоугольник должен иметь как минимум 3 вершины.");

            return;
        }

        const closedVertices = [...vertices];

        if (vertices[0].x !== vertices[vertices.length - 1].x || vertices[0].y !== vertices[vertices.length - 1].y) {
            closedVertices.push(vertices[0]);
        }

        ctx.beginPath();
        ctx.moveTo(closedVertices[0].x, closedVertices[0].y);

        for (let i = 1; i < closedVertices.length; i++) {
            ctx.lineTo(closedVertices[i].x, closedVertices[i].y);
        }

        ctx.closePath();
        ctx.fillStyle = "rgba(0, 128, 255, 0.5)";
        ctx.fill();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawVertices(closedVertices, "black");
        this.savePolygonData(vertices);
    }

    /**
     * Рисует тестовый прямоугольник на канвасе.
     * @param polygon
     */
    drawPolygon(polygon: CanvasElement): void {
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context or canvasRef is not available");
        }

        if (polygon.type === "circle" || polygon.type === "rotateButton") {
            this.drawCircle(polygon);
        }

        const vertices = polygon.vertices;

        if (
            (polygon.type === CanvasElementTypes.Polygon || polygon.type === CanvasElementTypes.FillPolygon) &&
            vertices.length < 2
        ) {
            console.error(`Canvas polygon of type ${polygon.type} needs at least 2 vertices`);

            return;
        }

        const styles = this.getPolygonStyle(polygon);

        ctx.save();

        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        ctx.setLineDash(styles.lineDash);
        ctx.fillStyle = styles.fillStyle;
        ctx.lineJoin = styles.lineJoin;
        ctx.lineCap = styles.lineCap;

        ctx.beginPath();

        if (vertices.length > 0) {
            ctx.moveTo(vertices[0].x, vertices[0].y);

            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }

            if (polygon.type !== CanvasElementTypes.Line) {
                ctx.closePath();
            }
        }

        if (polygon.type !== CanvasElementTypes.Line) {
            ctx.fill();
        }

        if (polygon.type !== CanvasElementTypes.FillPolygon) {
            ctx.stroke();
        }

        if ((polygon.state === "Selected" && polygon.type !== "fillPolygon") || polygon.type === "outlineElement") {
            this.drawVertices(vertices, styles.vertexColor, styles.vertexRadius);
        }

        ctx.restore();
    }

    /**
     * Сохраняет данные полигона для дальнейших преобразований.
     * @param vertices Массив координат вершин полигона.
     * @param type
     * @returns Объект типа Polygon с сохраненными данными.
     */
    savePolygonData(vertices: Point[], type?: CanvasElementTypes): CanvasElement {
        const newPolygon: CanvasElement = {
            id: generateUniqueId(),
            vertices: vertices.map((vertex) => ({ ...vertex })),
            style: BASE_STYLE,
            type: type || CanvasElementTypes.Polygon,
            state: "Normal",
        };

        this.#polygonStoreService.addNewPolygon(newPolygon);

        return newPolygon;
    }

    private getPolygonStyle(element: CanvasElement): CanvasElementStyle {
        const type = element.type;
        const stateSuffix = element.state === "Selected" ? "Selected" : "";
        const key = `${type}${stateSuffix}`;

        return ELEMENTS_STYLE_CONFIG[key] || BASE_STYLE;
    }

    /**
     * Рисует вершины полигона на канвасе.
     * @param vertices Массив координат вершин полигона.
     * @param color Цвет вершин (по умолчанию 'black').
     * @param radius
     */
    private drawVertices(vertices: Point[], color: string, radius: number = 5): void {
        const ctx = this.#canvasService.ctx;

        if (!ctx) {
            return;
        }

        ctx.fillStyle = color;

        vertices.forEach((vertex) => {
            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawCircle(circle: CanvasElement): void {
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context or canvasRef is not available");
        }

        if (circle.type !== CanvasElementTypes.Circle && circle.type !== CanvasElementEditorUnEditTypes.RotateButton) {
            console.error(`Canvas element of type ${circle.type} is not a circle`);

            return;
        }

        const { center, radius, startAngle, endAngle, counterclockwise } = circle as CircleElement;

        const hasVertex = circle.vertices && circle.vertices.length > 0;

        const styles = this.getPolygonStyle(circle);

        ctx.save();
        //
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        ctx.setLineDash(styles.lineDash);
        // ctx.fillStyle = styles.fillStyle;
        ctx.lineJoin = styles.lineJoin;
        ctx.lineCap = styles.lineCap;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle, counterclockwise);
        ctx.stroke();
        ctx.closePath();

        if (circle.state === "Selected" && circle.type !== CanvasElementEditorUnEditTypes.RotateButton) {
            if (hasVertex) {
                this.drawVertices(circle.vertices, styles.vertexColor, 1);
            }
        }

        ctx.restore();
    }
}
