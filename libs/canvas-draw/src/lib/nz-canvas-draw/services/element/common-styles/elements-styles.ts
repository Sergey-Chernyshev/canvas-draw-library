import { CanvasElementStyle } from "../models";

export const BASE_STYLE = {
    strokeStyle: "#34495e",
    lineWidth: 2,
    lineDash: [],
    fillStyle: "rgba(52, 152, 219, 0.1)",
    vertexColor: "#34495e",
    vertexRadius: 6,
    lineJoin: "round" as CanvasLineJoin,
    lineCap: "round" as CanvasLineCap,
};

export const ELEMENTS_STYLE_CONFIG: Record<string, CanvasElementStyle> = {
    line: {
        ...BASE_STYLE,
        strokeStyle: "#2980b9",
        lineWidth: 2,
        vertexRadius: 6,
    },
    lineSelected: {
        ...BASE_STYLE,
        strokeStyle: "#e74c3c",
        lineWidth: 3,
        lineDash: [8, 4],
        vertexColor: "#e74c3c",
        vertexRadius: 7,
        lineJoin: "round",
        lineCap: "round",
    },
    polygon: {
        ...BASE_STYLE,
        fillStyle: "rgba(46, 204, 113, 0.2)",
        strokeStyle: "#27ae60",
        lineWidth: 2,
    },
    polygonSelected: {
        ...BASE_STYLE,
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
        ...BASE_STYLE,
        fillStyle: "rgba(52, 152, 219, 0.2)",
        strokeStyle: "#2980b9",
        lineWidth: 2,
    },
    outlineElement: {
        ...BASE_STYLE,
        fillStyle: "rgba(0, 0, 0, 0)",
        strokeStyle: "#002b75",
        lineWidth: 1,
        vertexColor: "#001337",
        vertexRadius: 5,
        lineJoin: "miter" as CanvasLineJoin,
        lineCap: "butt" as CanvasLineCap,
    },
    text: {
        ...BASE_STYLE,
        fillStyle: "#2c3e50",
        font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    textSelected: {
        ...BASE_STYLE,
        fillStyle: "#f39c12",
        font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
};
