import { CanvasElementEditorUnEditTypes } from "../element";

export function isEditorUnEditType(type: string): type is CanvasElementEditorUnEditTypes {
    return Object.values(CanvasElementEditorUnEditTypes).includes(type as CanvasElementEditorUnEditTypes);
}
