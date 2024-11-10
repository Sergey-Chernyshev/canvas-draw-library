// canvas-library/services/canvas-init.service.ts

import { inject, Injectable } from '@angular/core';
import {
  CanvasService,
  CanvasSettingsService,
  CanvasStateService,
  CanvasStyleService, DrawPolygonService
} from '@untitled/canvas-draw-library';
import { CanvasRenderingService } from './canvas/canvas-rendering.service';

@Injectable({
  providedIn: 'root',
})
export class CanvasInitService {

  readonly #canvasService = inject(CanvasService);
  readonly #canvasStateService = inject(CanvasStateService);
  readonly #canvasSettingsService = inject(CanvasSettingsService);
  readonly #canvasStyleService = inject(CanvasStyleService);
  readonly #canvasRenderingService = inject(CanvasRenderingService);
  readonly #drawPolygonService = inject(DrawPolygonService)


  initialize(canvasElement: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvasElement.getContext('2d')!;

    this.#canvasService.ctx = ctx
    this.#canvasService.canvasElement = canvasElement;

    this.#canvasStyleService.initCanvasStyles()
    this.#drawPolygonService.startDrawing()
  }



}
