import { CommonModule } from "@angular/common";
import type { AfterViewInit, ElementRef } from "@angular/core";
import { Component, inject, ViewChild } from "@angular/core";
import { CanvasInitService, CanvasSettings, ElementService } from "@nz/nz-canvas-draw";

@Component({
    selector: "app-canvas",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./canvas.component.html",
    styleUrls: ["./canvas.component.less"],
})
export class CanvasComponent implements AfterViewInit {
    @ViewChild("canvas", { static: true })
    canvasRef!: ElementRef<HTMLCanvasElement>;

    @ViewChild("canvasMenu")
    canvasMenu!: ElementRef<HTMLDivElement>;

    readonly #canvasInitService = inject(CanvasInitService);
    readonly #canvasElementsService = inject(ElementService);
    // readonly #canvasStateService = inject(CanvasStateService);
    //
    // get getCanvasState(): Observable<EditorState> {
    //     return this.#canvasStateService.editorState$;
    // }

    ngAfterViewInit(): void {
        const canvasSettings: Partial<CanvasSettings> = {
            menuRef: this.canvasMenu,
        };

        this.#canvasInitService.initCanvas(this.canvasRef, canvasSettings);

        const rectangleVertices = [
            { x: 100, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 200 },
            { x: 100, y: 200 },
            { x: 200, y: 250 },
            { x: 50, y: 150 },
        ];

        const triangleVertices = [
            { x: 400, y: 100 },
            { x: 500, y: 300 },
            { x: 300, y: 300 },
        ];

        const pentagonVertices = [
            { x: 600, y: 100 }, // Вершина 1
            { x: 700, y: 150 },
            { x: 650, y: 250 },
            { x: 550, y: 250 },
            { x: 500, y: 150 },
        ];

        this.#canvasElementsService.drawTestPolygon(rectangleVertices);
        this.#canvasElementsService.drawTestPolygon(triangleVertices);
        this.#canvasElementsService.drawTestPolygon(pentagonVertices);
    }
}
