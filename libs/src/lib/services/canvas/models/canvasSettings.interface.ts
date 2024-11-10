export interface CanvasSettings {
  canvasBackgroundColor: string;
  panEnabled: boolean;     // Включено ли перемещение
  zoomEnabled: boolean;    // Включен ли зум
  zoomSpeed: number;       // Скорость зума (коэффициент)
  defaultColor: string;    // Дефолтный цвет всех элементов
  lineWidth: number;       // Ширина линии
}