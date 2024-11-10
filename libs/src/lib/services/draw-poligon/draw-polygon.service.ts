// libs/canvas-library/src/lib/services/draw-polygon.service.ts

import { Injectable } from '@angular/core';
import { CanvasStateService, Point } from '@untitled/canvas-draw-library';
import { CanvasRenderingService } from '../canvas/canvas-rendering.service';

@Injectable({
  providedIn: 'root',
})
export class DrawPolygonService {
  private isDrawing: boolean = false;

  constructor(
    private stateService: CanvasStateService,
    private renderingService: CanvasRenderingService
  ) {}

  /**
   * Инициализирует режим рисования полигона
   */
  startDrawing(): void {
    this.isDrawing = true;
    this.stateService.updateState({
      isDrawingMode: true,
      currentPolygon: [],
      currentMousePos: null,
      selectedPolygonIndex: null,
    });
    // Не обязательно вызывать redraw, так как CanvasRenderingService подписан на изменения состояния
  }

  /**
   * Завершает текущий процесс рисования полигона
   */
  finishDrawing(): void {
    const state = this.stateService.getState();
    if (state.currentPolygon.length > 2) {
      this.stateService.addPolygon(state.currentPolygon);
      this.stateService.clearCurrentPolygon();
      this.isDrawing = false;
      this.stateService.updateState({ isDrawingMode: false });
      // Redraw вызывается автоматически через подписку в CanvasRenderingService
    }
  }

  /**
   * Отменяет текущий процесс рисования полигона
   */
  cancelDrawing(): void {
    if (this.isDrawing) {
      this.stateService.clearCurrentPolygon();
      this.isDrawing = false;
      this.stateService.updateState({ isDrawingMode: false });
      // Redraw вызывается автоматически через подписку в CanvasRenderingService
    }
  }

  /**
   * Обрабатывает событие клика мыши для добавления точки в полигон или завершения рисования
   * @param event Событие клика мыши
   * @param canvas Элемент канваса
   */
  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const state = this.stateService.getState();
    const x =
      (event.clientX - rect.left - state.offsetX) / state.scale;
    const y =
      (event.clientY - rect.top - state.offsetY) / state.scale;

    if (this.isCloseToStart(x, y) && state.currentPolygon.length > 2) {
      this.finishDrawing();
    } else {
      const newPolygon = [...state.currentPolygon, { x, y }];
      this.stateService.updateState({ currentPolygon: newPolygon });
      // Redraw вызывается автоматически через подписку в CanvasRenderingService
    }
  }

  /**
   * Обрабатывает перемещение мыши для обновления текущей позиции курсора при рисовании
   * @param event Событие перемещения мыши
   * @param canvas Элемент канваса
   */
  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const state = this.stateService.getState();
    const x =
      (event.clientX - rect.left - state.offsetX) / state.scale;
    const y =
      (event.clientY - rect.top - state.offsetY) / state.scale;

    this.stateService.updateState({ currentMousePos: { x, y } });
    // Redraw вызывается автоматически через подписку в CanvasRenderingService
  }

  /**
   * Обрабатывает нажатие клавиш для завершения или отмены рисования
   * @param event Событие нажатия клавиши
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isDrawing) return;

    if (event.key === 'Enter') {
      this.finishDrawing();
    } else if (event.key === 'Escape') {
      this.cancelDrawing();
    }
  }

  /**
   * Проверяет, близко ли текущее положение мыши к началу полигона для завершения рисования
   * @param x Координата X текущей позиции мыши
   * @param y Координата Y текущей позиции мыши
   * @returns true, если курсор близко к началу, иначе false
   */
  private isCloseToStart(x: number, y: number): boolean {
    const state = this.stateService.getState();
    if (state.currentPolygon.length === 0) return false;
    const start = state.currentPolygon[0];
    const dx = x - start.x;
    const dy = y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 10 / state.scale;
  }
}
