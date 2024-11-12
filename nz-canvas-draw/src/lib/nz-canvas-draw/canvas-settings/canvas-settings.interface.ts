import { ElementRef } from '@angular/core';

export interface CanvasSettings {
    menuRef: ElementRef<HTMLDivElement> | null;
    width: number;
    height: number;
    backgroundColor: string;
    enableGrid: boolean;
    gridSize: number;
    gridColor: string;
    snapping: boolean;
    snapThreshold: number;
    enableZoom: boolean;
    minZoom: number;
    maxZoom: number;
    enablePanning: boolean;
    defaultLineColor: string;
    defaultLineWidth: number;
    defaultFillColor: string;
    showVertices: boolean;
    vertexRadius: number;
    vertexColor: string;
    selectedVertexColor: string;
    deepEditingMode: boolean;
    selectionColor: string;
    selectionLineWidth: number;
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
    menuRef: null,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    enableGrid: false,
    gridSize: 20,
    gridColor: '#e0e0e0',
    snapping: false,
    snapThreshold: 5,
    enableZoom: true,
    minZoom: 0.5,
    maxZoom: 2,
    enablePanning: true,
    defaultLineColor: '#000000',
    defaultLineWidth: 1,
    defaultFillColor: 'rgba(0, 0, 0, 0)',
    showVertices: true,
    vertexRadius: 5,
    vertexColor: '#0000ff',
    selectedVertexColor: '#ff0000',
    deepEditingMode: false,
    selectionColor: '#ff0000',
    selectionLineWidth: 2
};
