import { inject, Injectable } from "@angular/core";

import { CanvasService } from "../canvas.service";
import { Point } from "../canvas-editor";
import { generateUniqueId } from "../utils/functions-utils.utils";
import { CanvasPolygon, CanvasPolygonTypes } from "./models/element.interface";
import { PolygonsStoreService } from "./polygons-store.service";

interface PolygonStyle {
    strokeStyle: string;
    lineWidth: number;
    lineDash: number[];
    fillStyle: string;
    vertexColor: string;
    vertexRadius: number;
    lineJoin: CanvasLineJoin;
    lineCap: CanvasLineCap;
    font?: string; // Для текста
}

@Injectable({
    providedIn: "root",
})
export class PolygonsService {
    // readonly #polygonStylesConfig = {
    //     default: {
    //         strokeStyle: "black",
    //         lineWidth: 1,
    //         lineDash: [],
    //         fillStyle: "rgba(0, 0, 0, 0.2)", // Цвет заливки по умолчанию
    //         vertexColor: "black",
    //         vertexRadius: 5,
    //         lineJoin: "miter" as CanvasLineJoin, // Указываем тип CanvasLineJoin
    //         lineCap: "butt" as CanvasLineCap, // Указываем тип CanvasLineCap
    //     },
    //     selected: {
    //         strokeStyle: "#D92929",
    //         lineWidth: 2,
    //         lineDash: [5, 5],
    //         fillStyle: "#F7D4D4",
    //         vertexColor: "#D92929",
    //         vertexRadius: 6,
    //         lineJoin: "round" as CanvasLineJoin,
    //         lineCap: "round" as CanvasLineCap,
    //     },
    // };

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

    readonly #polygonStylesConfig: Record<string, PolygonStyle> = {
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
        fillPolygonSelected: {
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

        // Начинаем путь для рисования полигона
        ctx.beginPath();
        ctx.moveTo(closedVertices[0].x, closedVertices[0].y);

        for (let i = 1; i < closedVertices.length; i++) {
            ctx.lineTo(closedVertices[i].x, closedVertices[i].y);
        }

        ctx.closePath();
        ctx.fillStyle = "rgba(0, 128, 255, 0.5)"; // Полупрозрачная заливка
        ctx.fill();

        ctx.strokeStyle = "black"; // Цвет обводки
        ctx.lineWidth = 2; // Толщина линии
        ctx.stroke();

        this.drawVertices(closedVertices, "black");
        this.savePolygonData(vertices);
    }

    private getPolygonStyle(polygon: CanvasPolygon): PolygonStyle {
        const type = polygon.type.toLowerCase(); // Предполагается, что типы соответствуют ключам в стиле
        const stateSuffix = polygon.state === "Selected" ? "Selected" : "";
        const key = `${type}${stateSuffix}`;

        return this.#polygonStylesConfig[key] || this.#baseStyle;
    }

    /**
     * Рисует тестовый прямоугольник на канвасе.
     * @param polygon
     */
    drawPolygon(polygon: CanvasPolygon): void {
        const ctx = this.#canvasService.ctx;
        const canvasRef = this.#canvasService.canvasRef;

        if (!ctx || !canvasRef) {
            throw new Error("Canvas context or canvasRef is not available");
        }

        const vertices = polygon.vertices;

        // Проверка на минимальное количество вершин для типов Polygon и FillPolygon
        if (
            (polygon.type === CanvasPolygonTypes.Polygon || polygon.type === CanvasPolygonTypes.FillPolygon) &&
            vertices.length < 2
        ) {
            console.error(`Canvas polygon of type ${polygon.type} needs at least 2 vertices`);

            return;
        }

        // Получение стиля для текущего полигона
        const styles = this.getPolygonStyle(polygon);

        ctx.save(); // Сохранение текущего состояния контекста

        // Установка стилей контекста
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

            // Закрытие пути для типов, отличных от Line
            if (polygon.type !== CanvasPolygonTypes.Line) {
                ctx.closePath();
            }
        }

        // Выполнение заливки для типов, отличных от Line
        if (polygon.type !== CanvasPolygonTypes.Line) {
            ctx.fill();
        }

        // Выполнение обводки и отрисовка вершин для типов, отличных от FillPolygon
        if (polygon.type !== CanvasPolygonTypes.FillPolygon) {
            ctx.stroke();
            this.drawVertices(vertices, styles.vertexColor, styles.vertexRadius);
        }

        ctx.restore(); // Восстановление предыдущего состояния контекста
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

    /**
     * Сохраняет данные полигона для дальнейших преобразований.
     * @param vertices Массив координат вершин полигона.
     * @param type
     * @returns Объект типа Polygon с сохраненными данными.
     */
    savePolygonData(vertices: Point[], type?: CanvasPolygonTypes): CanvasPolygon {
        const newPolygon: CanvasPolygon = {
            id: generateUniqueId(),
            vertices: vertices.map((vertex) => ({ ...vertex })), // Копирование вершин
            style: {
                fillColor: "rgba(0, 128, 255, 0.5)",
                strokeColor: "black",
                lineWidth: 2,
            },
            type: type || CanvasPolygonTypes.Polygon,
            state: "Normal",
        };

        this.#polygonStoreService.addNewPolygon(newPolygon);

        return newPolygon;
    }

    // drawPolygon(polygon: CanvasPolygon): void {
    //     const ctx = this.#canvasService.ctx;
    //     const canvasRef = this.#canvasService.canvasRef;
    //     let drawVerticesColor = 'black';
    //     if (!ctx || !canvasRef) {
    //         throw new Error('Canvas context or canvasRef is not available');
    //     }
    //
    //     const vertices = polygon.vertices;
    //     if (vertices.length < 3) return;
    //
    //     ctx.beginPath();
    //     ctx.moveTo(vertices[0].x, vertices[0].y);
    //
    //     for (let i = 1; i < vertices.length; i++) {
    //         ctx.lineTo(vertices[i].x, vertices[i].y);
    //     }
    //     ctx.closePath();
    //     if (polygon.state === 'Selected') {
    //         ctx.strokeStyle = 'rgb(92,132,248)';
    //         ctx.lineWidth = 2;
    //         ctx.setLineDash([5, 5]);
    //         ctx.fillStyle = 'rgb(92,132,248, 0.8)';
    //         ctx.lineJoin = 'round'; // Плавные углы
    //         ctx.lineCap = 'round'; // Плавные концы линий
    //         drawVerticesColor = 'rgb(92,132,248)';
    //     } else {
    //         ctx.strokeStyle = 'black';
    //         ctx.setLineDash([]);
    //         ctx.fillStyle = polygon.style.fillColor;
    //     }
    //     ctx.fill();
    //     ctx.stroke();
    //
    //     // Рисуем вершины
    //     this.drawVertices(vertices, drawVerticesColor);
    // }
}
