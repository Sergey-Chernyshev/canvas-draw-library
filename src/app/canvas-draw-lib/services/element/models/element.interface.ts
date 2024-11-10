export interface CanvasPolygon {
  id: string;
  vertices: Array<{ x: number; y: number }>;
  style: CanvasPolygonStyle;
  state: 'Normal' | 'Selected' | 'Highlighted';
  transform?: CanvasPolygonTransform;
  metadata?: any;
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
