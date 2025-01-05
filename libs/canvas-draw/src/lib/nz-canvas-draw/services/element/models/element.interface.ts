import { FromEnum } from "../../../helpers/general";

export type CanvasPolygon = {
    id: string;
    vertices: CanvasDotCoordinate[];
    style: CanvasPolygonStyle;
    state: "Normal" | "Selected" | "Highlighted";
    transform?: CanvasPolygonTransform;
    type: CanvasPolygonTypes;
    metadata?: any;
};

export const CanvasPolygonTypes = {
    Polygon: "polygon",
    Line: "line",
    Point: "point",
    Circle: "circle",
    FillPolygon: "fillPolygon",
} as const;

export type CanvasPolygonTypes = FromEnum<typeof CanvasPolygonTypes>;

export interface CanvasDotCoordinate {
    x: number;
    y: number;
}

export interface CanvasPolygonStyle {
    fillColor: string;
    strokeColor: string;
    lineWidth: number;
    // Дополнительные свойства по необходимости
}

interface CanvasPolygonTransform {
    translation: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
}
