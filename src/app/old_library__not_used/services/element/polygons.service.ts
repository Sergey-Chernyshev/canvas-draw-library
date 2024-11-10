import { inject, Injectable } from '@angular/core';
import { CanvasService } from '../canvas.service';
import { CanvasPolygon } from './models/element.interface';
import { PolygonsStoreService } from './polygons-store.service';
@Injectable({
  providedIn: 'root'
})
export class PolygonsService {
  readonly #canvasService = inject(CanvasService);
  readonly #polygonStoreService = inject(PolygonsStoreService);

  /**
   * Рисует тестовый прямоугольник на канвасе.
   * @param vertices Массив координат вершин прямоугольника.
   */
  drawTestPolygon(vertices: Array<{ x: number; y: number }>): void {
    const ctx = this.#canvasService.ctx
    if(!ctx){
      throw new Error('Canvas context is not available');
    }
    if (vertices.length < 3) {
      console.error('Прямоугольник должен иметь как минимум 3 вершины.');
      return;
    }
    const closedVertices = [...vertices];
    if (vertices[0].x !== vertices[vertices.length - 1].x || vertices[0].y !== vertices[vertices.length - 1].y) {
      closedVertices.push(vertices[0]);
    }

    // Начинаем путь для рисования полигона
    ctx.beginPath();
    ctx.moveTo(closedVertices[0].x, closedVertices[0].y);

    for (let i = 1; i < closedVertices.length; i++) {
      ctx.lineTo(closedVertices[i].x, closedVertices[i].y);
    }

    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 128, 255, 0.5)'; // Полупрозрачная заливка
    ctx.fill();

    ctx.strokeStyle = 'black'; // Цвет обводки
    ctx.lineWidth = 2; // Толщина линии
    ctx.stroke();

    this.drawVertices(closedVertices, 'black');
    this.savePolygonData(vertices)
  }


  /**
   * Рисует вершины полигона на канвасе.
   * @param vertices Массив координат вершин полигона.
   * @param color Цвет вершин (по умолчанию 'black').
   */
  drawVertices(vertices: Array<{ x: number; y: number }>, color = 'black'): void {
    const ctx = this.#canvasService.ctx
    if(!ctx){
      throw new Error('Canvas context is not available');
    }

    vertices.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
    });
  }

  /**
   * Сохраняет данные полигона для дальнейших преобразований.
   * @param vertices Массив координат вершин полигона.
   * @returns Объект типа Polygon с сохраненными данными.
   */
  savePolygonData(vertices: Array<{ x: number; y: number }>): CanvasPolygon {
    const newPolygon: CanvasPolygon = {
      id: this.generateUniqueId(), // Метод для генерации уникального ID
      vertices: vertices.map(vertex => ({ ...vertex })), // Копирование вершин
      style: {
        fillColor: 'rgba(0, 128, 255, 0.5)',
        strokeColor: 'black',
        lineWidth: 2
      },
      state: 'Normal',
    };

    this.#polygonStoreService.addNewPolygon(newPolygon);
    return newPolygon;
  }

  private generateUniqueId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
  }



  /**
   * Рисует отдельный полигон на канвасе.
   * @param polygon Объект типа Polygon.
   */
  drawPolygon(polygon: CanvasPolygon): void {
    const ctx = this.#canvasService.ctx
    const canvasRef = this.#canvasService.canvasRef;
    let drawVerticesColor = "black";
    if(!ctx || !canvasRef){
      throw new Error('Canvas context or canvasRef is not available');
    }

    const vertices = polygon.vertices;
    if (vertices.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    if(polygon.state === 'Selected'){
        ctx.strokeStyle = 'rgb(92,132,248)';
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5]);
        ctx.fillStyle = 'rgb(92,132,248, 0.8)';
        ctx.lineJoin = 'round'; // Плавные углы
        ctx.lineCap = 'round'; // Плавные концы линий
        drawVerticesColor = "rgb(92,132,248)"
    }else{
        ctx.strokeStyle = "black"
        ctx.setLineDash([])
        ctx.fillStyle = polygon.style.fillColor;
    }
    ctx.fill();
    ctx.stroke();

    // Рисуем вершины
      this.drawVertices(vertices, drawVerticesColor);
  }

}
