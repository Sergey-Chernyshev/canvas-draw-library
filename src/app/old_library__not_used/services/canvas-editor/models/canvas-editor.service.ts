export interface TransformState {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export interface EditorState {
    stateValue: 'viewMode' | "selectMode";
    selectedPolygonId: string | null;
}
