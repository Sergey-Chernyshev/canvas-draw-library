// // libs/canvas-library/src/lib/services/canvas-event.service.ts
//
// import { inject, Injectable } from '@angular/core';
// import { CanvasSettingsService } from './canvas-settings.service';
// import { CanvasRenderingService, CanvasStateService } from '@untitled/canvas-draw-library';
// import { CanvasService } from './canvas.service';
//
// @Injectable({
//   providedIn: 'root',
// })
// export class CanvasEventService {
//   readonly #canvasService = inject(CanvasService);
//   readonly #canvasRenderingService = inject(CanvasRenderingService);
//   readonly #canvasSettingsService = inject(CanvasSettingsService);
//   readonly #canvasStateService = inject(CanvasStateService);
//
//   private isPanning = false;
//   private lastX = 0;
//   private lastY = 0;
//   private initialPinchDistance: number | null = null;
//
//
//   /**
//    * Инициализация обработчиков событий для канваса
//    */
//   initialize(): void {
//     const canvasElement = this.#canvasService.canvasElement;
//     if (!canvasElement) {
//       console.error('Canvas element is not available.');
//       return;
//     }
//
//     console.log('Initializing CanvasEventService and setting up event listeners.');
//
//     // Зум колесиком мыши
//     canvasElement.addEventListener('wheel', (event: WheelEvent) =>
//       this.handleWheelZoom(event)
//     );
//
//     // Панорамирование мышью
//     canvasElement.addEventListener('mousedown', (event: MouseEvent) =>
//       this.startPan(event)
//     );
//     window.addEventListener('mousemove', (event: MouseEvent) =>
//       this.pan(event)
//     );
//     window.addEventListener('mouseup', () => this.endPan());
//
//     // Зум и панорамирование для сенсорного экрана (тач)
//     canvasElement.addEventListener('touchstart', (event: TouchEvent) =>
//       this.handleTouchStart(event)
//     );
//     canvasElement.addEventListener('touchmove', (event: TouchEvent) =>
//       this.handleTouchMove(event)
//     );
//     canvasElement.addEventListener('touchend', () => this.endPan());
//
//     // Клики по канвасу
//     canvasElement.addEventListener('click', (event: MouseEvent) =>
//       this.handleClick(event)
//     );
//   }
//
//   /**
//    * Обработка события колесика мыши для зума
//    * @param event WheelEvent
//    */
//   private handleWheelZoom(event: WheelEvent): void {
//     const zoomEnabled = this.#canvasSettingsService.getSetting('zoomEnabled');
//     console.log('Wheel event detected. Zoom enabled:', zoomEnabled);
//     if (!zoomEnabled) return;
//
//     event.preventDefault();
//     const zoomSpeed = this.#canvasSettingsService.getSetting('zoomSpeed') || 1.1;
//     const zoomFactor = event.deltaY < 0 ? zoomSpeed : 1 / zoomSpeed;
//
//     console.log(
//       `Handling wheel zoom. deltaY: ${event.deltaY}, zoomFactor: ${zoomFactor}`
//     );
//
//     this.setZoom(this.#canvasStateService.scale * zoomFactor, event.offsetX, event.offsetY);
//   }
//
//   /**
//    * Начало панорамирования
//    * @param event MouseEvent | TouchEvent
//    */
//   private startPan(event: MouseEvent | TouchEvent): void {
//     const panEnabled = this.#canvasSettingsService.getSetting('panEnabled');
//     console.log('Start pan event detected. Pan enabled:', panEnabled);
//     if (!panEnabled) return;
//
//     this.isPanning = true;
//     if (event instanceof MouseEvent) {
//       this.lastX = event.clientX;
//       this.lastY = event.clientY;
//       console.log(`Panning started with mouse at (${this.lastX}, ${this.lastY})`);
//     } else if (event.touches.length === 1) {
//       this.lastX = event.touches[0].clientX;
//       this.lastY = event.touches[0].clientY;
//       console.log(`Panning started with touch at (${this.lastX}, ${this.lastY})`);
//     }
//   }
//
//   /**
//    * Выполнение панорамирования
//    * @param event MouseEvent | TouchEvent
//    */
//   private pan(event: MouseEvent | TouchEvent): void {
//     if (!this.isPanning) return;
//
//     let currentX: number, currentY: number;
//
//     if (event instanceof MouseEvent) {
//       currentX = event.clientX;
//       currentY = event.clientY;
//       console.log(`Panning with mouse to (${currentX}, ${currentY})`);
//     } else if (event.touches.length === 1) {
//       currentX = event.touches[0].clientX;
//       currentY = event.touches[0].clientY;
//       console.log(`Panning with touch to (${currentX}, ${currentY})`);
//     } else {
//       return;
//     }
//
//     const dx = (currentX - this.lastX) / this.#canvasStateService.scale;
//     const dy = (currentY - this.lastY) / this.#canvasStateService.scale;
//     this.#canvasStateService.offsetX += dx;
//     this.#canvasStateService.offsetY += dy;
//
//     console.log(
//       `Pan delta: (${dx.toFixed(2)}, ${dy.toFixed(2)}), New offset: (${this.#canvasStateService.offsetX.toFixed(
//         2
//       )}, ${this.#canvasStateService.offsetY.toFixed(2)})`
//     );
//
//     this.lastX = currentX;
//     this.lastY = currentY;
//
//     this.#canvasRenderingService.redraw();
//   }
//
//   /**
//    * Завершение панорамирования
//    */
//   private endPan(): void {
//     console.log('Pan ended.');
//     this.isPanning = false;
//     this.initialPinchDistance = null;
//   }
//
//   /**
//    * Обработка начала сенсорного зума (pinch-to-zoom)
//    * @param event TouchEvent
//    */
//   private handleTouchStart(event: TouchEvent): void {
//     console.log('Touch start detected with', event.touches.length, 'touch(es).');
//     if (event.touches.length === 2) {
//       this.initialPinchDistance = this.getPinchDistance(event);
//       console.log(
//         `Pinch-to-zoom started. Initial pinch distance: ${this.initialPinchDistance}`
//       );
//     }
//   }
//
//   /**
//    * Обработка сенсорного зума (pinch-to-zoom) и панорамирования
//    * @param event TouchEvent
//    */
//   private handleTouchMove(event: TouchEvent): void {
//     const zoomEnabled = this.#canvasSettingsService.getSetting('zoomEnabled');
//     const panEnabled = this.#canvasSettingsService.getSetting('panEnabled');
//
//     console.log(
//       `Touch move detected with ${event.touches.length} touch(es). Zoom enabled: ${zoomEnabled}, Pan enabled: ${panEnabled}`
//     );
//
//     if (event.touches.length === 2 && this.initialPinchDistance !== null && zoomEnabled) {
//       event.preventDefault();
//       const currentDistance = this.getPinchDistance(event);
//       const scaleChange = currentDistance / this.initialPinchDistance;
//       console.log(
//         `Pinch-to-zoom in progress. Current distance: ${currentDistance}, Scale change: ${scaleChange}`
//       );
//       this.setZoom(this.#canvasStateService.scale * scaleChange, event.touches[0].clientX, event.touches[0].clientY);
//       this.initialPinchDistance = currentDistance;
//     } else if (event.touches.length === 1 && panEnabled) {
//       console.log('Handling single touch pan.');
//       this.pan(event);
//     }
//   }
//
//   /**
//    * Вычисление расстояния между двумя пальцами для зума
//    * @param event TouchEvent
//    * @returns Расстояние между пальцами
//    */
//   private getPinchDistance(event: TouchEvent): number {
//     const dx = event.touches[0].clientX - event.touches[1].clientX;
//     const dy = event.touches[0].clientY - event.touches[1].clientY;
//     const distance = Math.sqrt(dx * dx + dy * dy);
//     console.log(`Current pinch distance: ${distance}`);
//     return distance;
//   }
//
//   /**
//    * Установка масштаба с учётом центра масштабирования
//    * @param scale Новый масштаб
//    * @param centerX Координата X центра масштабирования
//    * @param centerY Координата Y центра масштабирования
//    */
//   private setZoom(scale: number, centerX: number, centerY: number): void {
//     const prevScale = this.#canvasStateService.scale;
//     this.#canvasStateService.scale = scale;
//
//     // Расчёт смещений для масштабирования относительно точки (centerX, centerY)
//     const dx = (centerX - this.#canvasStateService.offsetX) / prevScale;
//     const dy = (centerY - this.#canvasStateService.offsetY) / prevScale;
//     this.#canvasStateService.offsetX -= dx * (scale - prevScale);
//     this.#canvasStateService.offsetY -= dy * (scale - prevScale);
//
//     console.log(
//       `Zoom set to scale: ${scale.toFixed(2)}, New offset: (${this.#canvasStateService.offsetX.toFixed(
//         2
//       )}, ${this.#canvasStateService.offsetY.toFixed(2)})`
//     );
//
//     this.#canvasRenderingService.redraw();
//   }
//
//   /**
//    * Обработка кликов по канвасу
//    * @param event MouseEvent
//    */
//   private handleClick(event: MouseEvent): void {
//     const x = event.offsetX;
//     const y = event.offsetY;
//     console.log(`Canvas clicked at: (${x}, ${y})`);
//
//     // Реализуйте дополнительную логику обработки кликов здесь
//     // Например, выделение элементов, создание новых фигур и т.д.
//   }
// }
