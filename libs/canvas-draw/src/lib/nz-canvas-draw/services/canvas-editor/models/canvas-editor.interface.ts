import { FromEnum } from "../../../helpers/general";
import type { CanvasPolygon } from "../../element/models/element.interface";

export type TransformState = {
    scale: number;
    offsetX: number;
    offsetY: number;
};

export type EditorState = {
    editorMode: EditorMode;
    selectedPolygonId: string | null;
    selectedPolygon: CanvasPolygon | null;
    draftPolygon: CanvasPolygon | null;
};

export const EditorMode = {
    ViewMode: "viewMode",
    SelectMode: "selectMode",
    DrawPolygon: "drawPolygon",
    DrawText: "drawText",
    DrawLine: "drawLine",
    DrawCircle: "drawCircle",
} as const;

export type EditorMode = FromEnum<typeof EditorMode>;

export type PointerMoveData = Point & {
    deltaX: number;
    deltaY: number;
};

export type Point = {
    x: number;
    y: number;
};
