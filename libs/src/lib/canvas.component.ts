// canvas-library/components/canvas.component.ts (полный код)

import { AfterViewInit, Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasRenderingService } from './services/canvas-rendering.service';
import { CanvasInteractionService } from './services/canvas-interaction.service';
import { CanvasLayerService } from './services/canvas-layer.service';
import { CanvasStateService } from './services/canvas-state.service';

@Component({
    selector: 'lib-canvas-draw',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.less'],
})
export class CanvasComponent implements AfterViewInit {
    @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
    readonly #canvasStateService = inject(CanvasStateService)


    constructor(
        protected renderingService: CanvasRenderingService,
        private interactionService: CanvasInteractionService,
        private layerService: CanvasLayerService
    ) {}

    ngAfterViewInit(): void {
        const canvas = this.canvasRef.nativeElement;
        const dpr = window.devicePixelRatio || 1;

        // Инициализация контекста рисования
        const ctx = canvas.getContext('2d')!;
        this.renderingService.setContext(ctx);

        // Установка размеров канваса
        this.renderingService.setCanvasDimensions(window.innerWidth, window.innerHeight, dpr);

        // Перерисовка канваса
        this.renderingService.redraw();
    }

    // Обработчик события изменения размера окна
    @HostListener('window:resize')
    onResize(): void {
        const canvas = this.canvasRef.nativeElement;
        const dpr = window.devicePixelRatio || 1;
        this.renderingService.setCanvasDimensions(window.innerWidth, window.innerHeight, dpr);
    }

    // Обработчик события клика мыши
    @HostListener('click', ['$event'])
    onClick(event: MouseEvent): void {
        const canvas = this.canvasRef.nativeElement;
        this.interactionService.handleClick(event, canvas);
    }

    // Обработчик события нажатия клавиши
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        this.interactionService.handleKeyDown(event);
    }

    // Обработчики событий мыши, делегированные сервису
    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent): void {
        const canvas = this.canvasRef.nativeElement;
        this.interactionService.handleMouseDown(event, canvas);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        const canvas = this.canvasRef.nativeElement;
        this.interactionService.handleMouseMove(event, canvas);
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent): void {
        this.interactionService.handleMouseUp();
    }

    private scale = 1; // Начальный масштаб
    private scaleFactor = 1.1; // Фактор изменения масштаба при зуме




    // Методы для управления слоями
    setDrawingMode(): void {
        this.#canvasStateService.isDrawingMode = true;
        this.#canvasStateService.selectedPolygonIndex = null;
        this.#canvasStateService.draggedVertex = null;
        this.#canvasStateService.draggedPolygonIndex = null;
        this.renderingService.redraw();
    }

    setSelectionMode(): void {
        this.#canvasStateService.isDrawingMode = false;
        this.#canvasStateService.currentPolygon = [];
        this.#canvasStateService.draggedVertex = null;
        this.#canvasStateService.draggedPolygonIndex = null;
        this.renderingService.redraw();
    }

    moveForward(): void {
        const index = this.layerService.stateService.selectedPolygonIndex;
        if (index !== null) {
            this.layerService.moveForward(index);
            this.renderingService.redraw();
        }
    }

    moveBackward(): void {
        const index = this.layerService.stateService.selectedPolygonIndex;
        if (index !== null) {
            this.layerService.moveBackward(index);
            this.renderingService.redraw();
        }
    }
}
