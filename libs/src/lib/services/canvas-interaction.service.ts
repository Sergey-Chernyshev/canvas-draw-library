// canvas-library/services/canvas-interaction.service.ts

import { Injectable } from '@angular/core';
import { CanvasStateService, Point } from './canvas-state.service';
import { CanvasSelectionService } from './canvas-selection.service';
import { CanvasRenderingService } from './canvas-rendering.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasInteractionService {
    private dragThreshold = 5;

    constructor(
        private stateService: CanvasStateService,
        private selectionService: CanvasSelectionService,
        private renderingService: CanvasRenderingService,
    ) {}



    handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.stateService.offsetX) / this.stateService.scale;
        const y = (event.clientY - rect.top - this.stateService.offsetY) / this.stateService.scale;

        if (!this.stateService.isDrawingMode && this.stateService.selectedPolygonIndex !== null) {
            const polygon = this.stateService.polygons[this.stateService.selectedPolygonIndex];
            const vertexIndex = this.selectionService.getVertexAtPosition(x, y, polygon);
            if (vertexIndex !== null) {
                // Начинаем перетаскивание вершины
                this.stateService.draggedVertex = { polygonIndex: this.stateService.selectedPolygonIndex, vertexIndex };
                this.stateService.isDraggingVertex = true;
                this.stateService.lastX = event.clientX;
                this.stateService.lastY = event.clientY;
                this.stateService.preventClick = false;
                return;
            }

            // Если клик не на вершине, проверяем, внутри ли кликнутого полигона
            if (this.selectionService.isPointInPolygon(x, y, polygon)) {
                // Начинаем перетаскивание всего полигона
                this.stateService.isDraggingPolygon = true;
                this.stateService.draggedPolygonIndex = this.stateService.selectedPolygonIndex;
                this.stateService.lastX = event.clientX;
                this.stateService.lastY = event.clientY;
                this.stateService.preventClick = false;
                return;
            }
        }

        // Начинаем панорамирование канваса
        this.stateService.isPanning = true;
        this.stateService.hasDragged = false;
        this.stateService.preventClick = false;
        this.stateService.lastX = event.clientX;
        this.stateService.lastY = event.clientY;
    }

    handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.stateService.offsetX) / this.stateService.scale;
        const y = (event.clientY - rect.top - this.stateService.offsetY) / this.stateService.scale;

        if (this.stateService.isDraggingVertex && this.stateService.draggedVertex) {
            // Перетаскивание вершины
            const { polygonIndex, vertexIndex } = this.stateService.draggedVertex;
            this.stateService.polygons[polygonIndex][vertexIndex] = { x, y };
            this.renderingService.redraw();
            return;
        }

        if (this.stateService.isDraggingPolygon && this.stateService.draggedPolygonIndex !== null) {
            // Перетаскивание всего полигона
            const dx = event.clientX - this.stateService.lastX;
            const dy = event.clientY - this.stateService.lastY;

            this.stateService.lastX = event.clientX;
            this.stateService.lastY = event.clientY;

            // Обновляем все вершины полигона
            this.stateService.polygons[this.stateService.draggedPolygonIndex].forEach(point => {
                point.x += dx / this.stateService.scale;
                point.y += dy / this.stateService.scale;
            });
            this.renderingService.redraw();
            return;
        }

        if (this.stateService.isPanning) {
            const dx = event.clientX - this.stateService.lastX;
            const dy = event.clientY - this.stateService.lastY;

            this.stateService.lastX = event.clientX;
            this.stateService.lastY = event.clientY;

            this.stateService.offsetX += dx;
            this.stateService.offsetY += dy;
            this.renderingService.redraw();

            if (!this.stateService.hasDragged) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > this.dragThreshold) {
                    this.stateService.hasDragged = true;
                    this.stateService.preventClick = true;
                }
            }
        } else if (this.stateService.isDrawingMode && this.stateService.currentPolygon.length > 0) {
            // Обновляем положение мыши для превью линии
            this.stateService.currentMousePos = { x, y };
            this.renderingService.redraw();
        } else if (!this.stateService.isDrawingMode) {
            // Режим выделения: проверяем наведение на вершину
            const polygon = this.stateService.selectedPolygonIndex !== null
                ? this.stateService.polygons[this.stateService.selectedPolygonIndex]
                : null;
            if (polygon) {
                const vertexIndex = this.selectionService.getVertexAtPosition(x, y, polygon);
                const isHovering = vertexIndex !== null;
                if (isHovering !== this.stateService.isHoveringVertex) {
                    this.stateService.isHoveringVertex = isHovering;
                    canvas.style.cursor = isHovering ? 'pointer' : 'default';
                }
            }
        }
    }

    handleMouseUp(): void {
        if (this.stateService.isDraggingVertex) {
            // Завершение перетаскивания вершины
            this.stateService.isDraggingVertex = false;
            this.stateService.draggedVertex = null;
        }

        if (this.stateService.isDraggingPolygon) {
            // Завершение перетаскивания полигона
            this.stateService.isDraggingPolygon = false;
            this.stateService.draggedPolygonIndex = null;
        }

        if (this.stateService.isPanning) {
            // Завершение панорамирования
            this.stateService.isPanning = false;
            if (this.stateService.hasDragged) {
                this.stateService.preventClick = true;
            }
        }

        this.stateService.hasDragged = false;
        this.stateService.currentMousePos = null;
        this.renderingService.redraw();
    }

    handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
        if (this.stateService.preventClick) {
            this.stateService.preventClick = false;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.stateService.offsetX) / this.stateService.scale;
        const y = (event.clientY - rect.top - this.stateService.offsetY) / this.stateService.scale;

        if (this.stateService.isDrawingMode) {
            // Режим рисования
            if (this.stateService.currentPolygon.length > 0 && this.isCloseToStart(x, y)) {
                this.completePolygon();
            } else {
                this.stateService.currentPolygon.push({ x, y });
                this.renderingService.redraw();
            }
        } else {
            // Режим выделения
            this.selectionService.selectPolygon(x, y);
            this.renderingService.redraw();
        }
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.cancelCurrentPolygon();
        }
    }

    private isCloseToStart(x: number, y: number): boolean {
        if (this.stateService.currentPolygon.length === 0) return false;
        const start = this.stateService.currentPolygon[0];
        const dx = x - start.x;
        const dy = y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 10;
    }

    private completePolygon(): void {
        this.stateService.addPolygon(this.stateService.currentPolygon);
        this.stateService.clearCurrentPolygon();
        this.renderingService.redraw();
    }

    private cancelCurrentPolygon(): void {
        if (this.stateService.currentPolygon.length > 0) {
            this.stateService.clearCurrentPolygon();
            this.renderingService.redraw();
        }
    }
}
