// libs/canvas-library/src/lib/services/canvas-rendering.service.ts

import { Injectable, OnDestroy } from '@angular/core';
import { CanvasStateInterface, CanvasStateService, Point } from '@untitled/canvas-draw-library';
import { Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CanvasRenderingService implements OnDestroy {
    private ctx!: CanvasRenderingContext2D;
    private stateSubscription!: Subscription;

    constructor(public stateService: CanvasStateService) {
        // Подписываемся на изменения состояния
        this.stateSubscription = this.stateService.state$.subscribe(state => {
            this.redraw(state);
        });
    }

    /**
     * Устанавливает контекст канваса
     * @param ctx Контекст 2D канваса
     */
    setContext(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    /**
     * Устанавливает размеры канваса с учетом device pixel ratio
     * @param width Ширина канваса в CSS пикселях
     * @param height Высота канваса в CSS пикселях
     * @param dpr Device Pixel Ratio
     */
    setCanvasDimensions(width: number, height: number, dpr: number): void {
        if (!this.ctx) return;
        const canvas = this.ctx.canvas;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.redraw(this.stateService.getState());
    }

    /**
     * Очищает канвас
     */
    clearCanvas(): void {
        if (!this.ctx) return;
        const canvas = this.ctx.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Рисует все формы на канвасе
     * @param state Текущее состояние канваса
     */
    drawShapes(state: CanvasStateInterface): void {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.translate(state.offsetX, state.offsetY);
        this.ctx.scale(state.scale, state.scale);

        // Рисуем все полигоны
        state.polygons.forEach((polygon, index) => {
            this.drawPolygon(polygon, true);

            // Если полигон выбран, подсвечиваем его и рисуем вершины
            if (state.selectedPolygonIndex === index) {
                this.ctx.strokeStyle = 'orange';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.drawVertices(polygon, 'orange');
            }
        });

        // Рисуем текущий рисуемый полигон
        if (state.isDrawingMode && state.currentPolygon.length > 0) {
            this.drawPolygon(state.currentPolygon, false);
            this.drawVertices(state.currentPolygon);

            // Рисуем превью линии от последней точки к текущей позиции мыши
            if (state.currentMousePos) {
                const lastPoint = state.currentPolygon[state.currentPolygon.length - 1];
                this.ctx.beginPath();
                this.ctx.moveTo(lastPoint.x, lastPoint.y);
                this.ctx.lineTo(state.currentMousePos.x, state.currentMousePos.y);
                this.ctx.strokeStyle = 'gray';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 3]); // Пунктирная линия для превью
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.closePath();
            }
        }

        this.ctx.restore();
    }

    /**
     * Рисует полигон
     * @param polygon Массив точек полигона
     * @param fill Флаг заполнения полигона
     */
    private drawPolygon(polygon: Point[], fill: boolean): void {
        if (polygon.length === 0) return;

        this.ctx.beginPath();
        this.ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
            this.ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        if (fill) {
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            this.ctx.fill();
        }

        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Рисует вершины полигона
     * @param polygon Массив точек полигона
     * @param color Цвет вершин
     */
    private drawVertices(polygon: Point[], color: string = 'black'): void {
        polygon.forEach((point) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.closePath();
        });
    }

    /**
     * Перерисовывает канвас на основе текущего состояния
     * @param state Текущее состояние канваса
     */
    redraw(state: CanvasStateInterface): void {
        this.clearCanvas();
        this.drawShapes(state);
    }

    /**
     * Освобождает ресурсы при уничтожении сервиса
     */
    ngOnDestroy(): void {
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
        }
    }
}
