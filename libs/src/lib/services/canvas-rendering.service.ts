// canvas-library/services/canvas-rendering.service.ts

import { Injectable } from '@angular/core';
import { CanvasStateService, Point } from './canvas-state.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasRenderingService {
    private ctx!: CanvasRenderingContext2D;

    constructor(public stateService: CanvasStateService) {}

    setContext(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    setCanvasDimensions(width: number, height: number, dpr: number): void {
        const canvas = this.ctx.canvas;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    clearCanvas(): void {
        const canvas = this.ctx.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawShapes(): void {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.translate(this.stateService.offsetX, this.stateService.offsetY);
        this.ctx.scale(this.stateService.scale, this.stateService.scale);

        // Рисуем все полигоны
        this.stateService.polygons.forEach((polygon, index) => {
            this.drawPolygon(polygon, true);

            // Если полигон выбран, подсвечиваем его и рисуем вершины
            if (this.stateService.selectedPolygonIndex === index) {
                this.ctx.strokeStyle = 'orange';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.drawVertices(polygon, 'orange');
            }
        });

        // Рисуем текущий рисуемый полигон
        if (this.stateService.isDrawingMode && this.stateService.currentPolygon.length > 0) {
            this.drawPolygon(this.stateService.currentPolygon, false);
            this.drawVertices(this.stateService.currentPolygon);

            // Рисуем превью линии от последней точки к текущей позиции мыши
            if (this.stateService.currentMousePos) {
                const lastPoint = this.stateService.currentPolygon[this.stateService.currentPolygon.length - 1];
                this.ctx.beginPath();
                this.ctx.moveTo(lastPoint.x, lastPoint.y);
                this.ctx.lineTo(this.stateService.currentMousePos.x, this.stateService.currentMousePos.y);
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

    private drawVertices(polygon: Point[], color: string = 'black'): void {
        polygon.forEach((point) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.closePath();
        });
    }

    redraw(): void {
        this.clearCanvas();
        this.drawShapes();
    }
}
