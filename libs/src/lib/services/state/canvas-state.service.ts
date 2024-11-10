// libs/canvas-library/src/lib/services/canvas-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Point } from '@untitled/canvas-draw-library';
import { CanvasStateInterface, DraggedVertex } from './models/canvas-state.interface';

@Injectable({
  providedIn: 'root',
})
export class CanvasStateService {
  // Инициализация начального состояния
  private initialState: CanvasStateInterface = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    isHoveringVertex: false,

    lastX: 0,
    lastY: 0,

    isDrawingMode: false, // Изменено на false по умолчанию
    selectedPolygonIndex: null,

    currentPolygon: [],
    polygons: [],

    isDraggingVertex: false,
    draggedVertex: null,

    isDraggingPolygon: false,
    draggedPolygonIndex: null,

    isPanning: false,
    hasDragged: false,

    currentMousePos: null,
    preventClick: false,
  };

  private stateSubject = new BehaviorSubject<CanvasStateInterface>({ ...this.initialState });

  public state$: Observable<CanvasStateInterface> = this.stateSubject.asObservable();

  /**
   * Метод для получения текущего состояния
   */
  public getState(): CanvasStateInterface {
    return { ...this.stateSubject.getValue() };
  }

  /**
   * Универсальный метод для обновления состояния
   * Принимает частичный объект состояния и обновляет соответствующие поля
   * @param newState Частичное состояние для обновления
   */
  public updateState(newState: Partial<CanvasStateInterface>): void {
    const currentState = this.stateSubject.getValue();
    const updatedState = { ...currentState, ...newState };
    this.stateSubject.next(updatedState);
  }

  /**
   * Метод для добавления нового полигона
   * @param polygon Массив точек нового полигона
   */
  public addPolygon(polygon: Point[]): void {
    const currentState = this.getState();
    const updatedPolygons = [...currentState.polygons, polygon];
    this.updateState({ polygons: updatedPolygons });
  }

  /**
   * Метод для очистки текущего рисуемого полигона
   */
  public clearCurrentPolygon(): void {
    this.updateState({ currentPolygon: [], currentMousePos: null });
  }

  /**
   * Метод для выбора полигона по индексу
   * @param index Индекс выбранного полигона
   */
  public selectPolygon(index: number | null): void {
    this.updateState({ selectedPolygonIndex: index });
  }

  /**
   * Метод для обновления позиции вершины полигона
   * @param polygonIndex Индекс полигона
   * @param vertexIndex Индекс вершины
   * @param newPoint Новые координаты вершины
   */
  public updateVertex(polygonIndex: number, vertexIndex: number, newPoint: Point): void {
    const currentState = this.getState();
    const polygons = [...currentState.polygons];
    if (polygons[polygonIndex] && polygons[polygonIndex][vertexIndex]) {
      polygons[polygonIndex] = polygons[polygonIndex].map((point, idx) =>
        idx === vertexIndex ? newPoint : point
      );
      this.updateState({ polygons });
    }
  }

  /**
   * Метод для обновления позиции всего полигона
   * @param polygonIndex Индекс полигона
   * @param dx Изменение по оси X
   * @param dy Изменение по оси Y
   */
  public movePolygon(polygonIndex: number, dx: number, dy: number): void {
    const currentState = this.getState();
    const polygons = [...currentState.polygons];
    if (polygons[polygonIndex]) {
      polygons[polygonIndex] = polygons[polygonIndex].map(point => ({
        x: point.x + dx / currentState.scale,
        y: point.y + dy / currentState.scale,
      }));
      this.updateState({ polygons });
    }
  }

  /**
   * Метод для подписки на конкретную часть состояния
   * @param selector Функция выбора части состояния из полного состояния
   * @returns Observable выбранной части состояния
   */
  public select<K>(selector: (state: CanvasStateInterface) => K): Observable<K> {
    return new Observable<K>(observer => {
      const subscription = this.state$.subscribe(state => {
        observer.next(selector(state));
      });
      return () => subscription.unsubscribe();
    });
  }
}
