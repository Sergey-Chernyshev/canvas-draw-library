import { ElementRef, Injectable } from '@angular/core';

@Injectable(
  {providedIn: 'root'}
)
export class CanvasService {
  #canvasRef: ElementRef<HTMLCanvasElement> | null = null;
  #ctx: CanvasRenderingContext2D | null = null;

  get ctx(): CanvasRenderingContext2D | null {
    return this.#ctx;
  }

  set ctx(ctx: CanvasRenderingContext2D) {
    this.#ctx = ctx;
  }

  get canvasRef(): ElementRef<HTMLCanvasElement> | null {
    return this.#canvasRef;
  }

  set canvasRef(canvasRef :ElementRef<HTMLCanvasElement>) {
    this.#canvasRef = canvasRef;
  }

}