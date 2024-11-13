import type { CanvasPolygon } from "../../element/models/element.interface";

export interface TransformState {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export interface EditorState {
    stateValue: "viewMode" | "selectMode";
    selectedPolygonId: string | null;
    selectedPolygon: CanvasPolygon | null;
}
