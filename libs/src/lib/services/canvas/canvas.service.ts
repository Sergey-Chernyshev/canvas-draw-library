import { inject, Injectable } from '@angular/core';
import { CanvasStateService } from '@untitled/canvas-draw-library';
import { CanvasSettingsService } from './canvas-settings.service';
import { CanvasRenderingService } from './canvas-rendering.service';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  readonly #canvasRenderingService = inject(CanvasRenderingService);
  readonly #canvasStateService = inject(CanvasStateService);
  readonly #canvasSettingsService = inject(CanvasSettingsService);

  #_canvasElement!: HTMLCanvasElement;
  #_ctx!: CanvasRenderingContext2D;

  set ctx(ctx: CanvasRenderingContext2D) {
    this.#_ctx = ctx;
  }

  get ctx(): CanvasRenderingContext2D{
    return this.#_ctx;
  }

  set canvasElement(canvasElement: HTMLCanvasElement) {
    this.#_canvasElement = canvasElement;
  }

  get canvasElement(): HTMLCanvasElement{
    return this.#_canvasElement;
  }




}