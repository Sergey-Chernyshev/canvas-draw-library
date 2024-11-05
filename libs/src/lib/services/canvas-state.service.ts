// canvas-library/services/canvas-state.service.ts

import { Injectable } from '@angular/core';

export interface Point {
    x: number;
    y: number;
}

@Injectable({
    providedIn: 'root',
})
export class CanvasStateService {
    public scale: number = 1;
    public offsetX: number = 0;
    public offsetY: number = 0;

    public isHoveringVertex: boolean = false;

    public lastX: number = 0;
    public lastY: number = 0;

    public isDrawingMode: boolean = true;
    public selectedPolygonIndex: number | null = null;

    public currentPolygon: Point[] = [];
    public polygons: Point[][] = [];

    public isDraggingVertex: boolean = false;
    public draggedVertex: { polygonIndex: number; vertexIndex: number } | null = null;

    public isDraggingPolygon: boolean = false;
    public draggedPolygonIndex: number | null = null;

    public isPanning: boolean = false;
    public hasDragged: boolean = false;

    public currentMousePos: Point | null = null;
    public preventClick: boolean = false;

    constructor() {}

    // Методы для управления состоянием могут быть добавлены здесь
    addPolygon(polygon: Point[]): void {
        this.polygons.push([...polygon]);
    }

    clearCurrentPolygon(): void {
        this.currentPolygon = [];
        this.currentMousePos = null;
    }

    // Другие методы для управления состоянием...
}
