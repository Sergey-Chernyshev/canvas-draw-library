export interface Point {
  x: number;
  y: number;
}


export interface DraggedVertex {
  polygonIndex: number;
  vertexIndex: number;
}

export interface CanvasStateInterface {
  scale: number;
  offsetX: number;
  offsetY: number;

  isHoveringVertex: boolean;

  lastX: number;
  lastY: number;

  isDrawingMode: boolean;
  selectedPolygonIndex: number | null;

  currentPolygon: Point[];
  polygons: Point[][];

  isDraggingVertex: boolean;
  draggedVertex: DraggedVertex | null;

  isDraggingPolygon: boolean;
  draggedPolygonIndex: number | null;

  isPanning: boolean;
  hasDragged: boolean;

  currentMousePos: Point | null;
  preventClick: boolean;
}