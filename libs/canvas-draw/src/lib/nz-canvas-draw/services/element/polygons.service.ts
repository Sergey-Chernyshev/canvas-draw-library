import { inject, Injectable } from "@angular/core";

import { CanvasService } from "../canvas.service";
import { Point } from "../canvas-editor";
import { generateUniqueId } from "../utils";
import { CanvasElement, CanvasElementStyle, CanvasElementTypes } from "./models";
import { PolygonsStoreService } from "./polygons-store.service";

@Injectable({
    providedIn: "root",
})
export class PolygonsService {
    readonly #baseStyle = {
        strokeStyle: "#34495e",
        lineWidth: 2,
        lineDash: [],
        fillStyle: "rgba(52, 152, 219, 0.1)",
        vertexColor: "#34495e",
        vertexRadius: 6,
        lineJoin: "round" as CanvasLineJoin,
        lineCap: "round" as CanvasLineCap,
    };

    readonly #polygonStylesConfig: Record<string, CanvasElementStyle> = {
        line: {
            ...this.#baseStyle,
            strokeStyle: "#2980b9",
            lineWidth: 2,
            vertexRadius: 6,
        },
        lineSelected: {
            ...this.#baseStyle,
            strokeStyle: "#e74c3c",
            lineWidth: 3,
            lineDash: [8, 4],
            vertexColor: "#e74c3c",
            vertexRadius: 7,
            lineJoin: "round",
            lineCap: "round",
        },
        polygon: {
            ...this.#baseStyle,
            fillStyle: "rgba(46, 204, 113, 0.2)",
            strokeStyle: "#27ae60",
            lineWidth: 2,
        },
        polygonSelected: {
            ...this.#baseStyle,
            fillStyle: "rgba(231, 76, 60, 0.2)",
            strokeStyle: "#c0392b",
            lineWidth: 3,
            lineDash: [8, 4],
            vertexColor: "#c0392b",
            vertexRadius: 7,
            lineJoin: "round",
            lineCap: "round",
        },
        fillPolygon: {
            ...this.#baseStyle,
            fillStyle: "rgba(52, 152, 219, 0.2)",
            strokeStyle: "#2980b9",
            lineWidth: 2,
        },
        outlineElement: {
            ...this.#baseStyle,
            fillStyle: "rgba(0, 0, 0, 0)",
            strokeStyle: "#002b75",
            lineWidth: 1,
            vertexColor: "#001337",
            vertexRadius: 5,
            lineJoin: "miter" as CanvasLineJoin,
            lineCap: "butt" as CanvasLineCap,
        },
        text: {
            ...this.#baseStyle,
            fillStyle: "#2c3e50",
            font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
        textSelected: {
            ...this.#baseStyle,
            fillStyle: "#f39c12",
            font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
    };

    readonly #canvasService = inject(CanvasService);
    readonly #polygonStoreService = inject(PolygonsStoreService);

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
            style: this.#baseStyle,
            type: type || CanvasElementTypes.Polygon,
            state: "Normal",
        };

        this.#polygonStoreService.addNewPolygon(newPolygon);

        return newPolygon;
    }

    private getPolygonStyle(polygon: CanvasElement): CanvasElementStyle {
        const type = polygon.type;
        const stateSuffix = polygon.state === "Selected" ? "Selected" : "";
        const key = `${type}${stateSuffix}`;

        return this.#polygonStylesConfig[key] || this.#baseStyle;
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
}
