import { FromEnum } from "../../../helpers/general";
import type { CanvasElement } from "../../element/models/element.module";

export type TransformState = {
    scale: number;
    offsetX: number;
    offsetY: number;
};

export type EditorState = {
    editorMode: EditorMode;
    selectedPolygonId: string | null;
    selectedPolygon: CanvasElement | null;
    draftPolygon: CanvasElement | null;
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
