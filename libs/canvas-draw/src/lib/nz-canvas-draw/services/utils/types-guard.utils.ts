import { CanvasPolygonEditorUnEditTypes } from "../element";

export function isEditorUnEditType(type: string): type is CanvasPolygonEditorUnEditTypes {
    return Object.values(CanvasPolygonEditorUnEditTypes).includes(type as CanvasPolygonEditorUnEditTypes);
}
