import { FromEnum } from "../../../helpers/general";

export type CanvasPolygon = {
    id: string;
    vertices: CanvasDotCoordinate[];
    style: CanvasPolygonStyle;
    state: "Normal" | "Selected" | "Highlighted" | "OutlineEditorUnselected";
    transform?: CanvasPolygonTransform;
    type: CanvasPolygonTypes;
    metadata?: any;
};

export const CanvasPolygonEditorUnEditTypes = {
    OutlinePolygon: "outlinePolygon",
} as const;

export type CanvasPolygonEditorUnEditTypes = FromEnum<typeof CanvasPolygonEditorUnEditTypes>;

export const CanvasPolygonTypes = {
    ...CanvasPolygonEditorUnEditTypes,
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
}

interface CanvasPolygonTransform {
    translation: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
}
