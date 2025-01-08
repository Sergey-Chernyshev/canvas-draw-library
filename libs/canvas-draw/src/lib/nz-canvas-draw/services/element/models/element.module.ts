import { FromEnum } from "../../../helpers/general";

export type CanvasElement = {
    id: string;
    vertices: Point[];
    style: CanvasElementStyle;
    state: "Normal" | "Selected" | "Highlighted" | "OutlineEditorUnselected";
    transform?: CanvasElementTransform;
    type: CanvasElementTypes;
    metadata?: any;
};

export const CanvasElementEditorUnEditTypes = {
    OutlineElement: "outlineElement",
} as const;

export type CanvasElementEditorUnEditTypes = FromEnum<typeof CanvasElementEditorUnEditTypes>;

export const CanvasElementTypes = {
    ...CanvasElementEditorUnEditTypes,
    Polygon: "polygon",
    Line: "line",
    Point: "point",
    Circle: "circle",
    FillPolygon: "fillPolygon",
} as const;

export type CanvasElementTypes = FromEnum<typeof CanvasElementTypes>;

export type CanvasElementStyle = {
    strokeStyle: string;
    lineWidth: number;
    lineDash: number[];
    fillStyle: string;
    vertexColor: string;
    vertexRadius: number;
    lineJoin: CanvasLineJoin;
    lineCap: CanvasLineCap;
    font?: string;
};

interface CanvasElementTransform {
    translation: Point;
    rotation: number;
    scale: Point;
}

type Point = {
    x: number;
    y: number;
};
