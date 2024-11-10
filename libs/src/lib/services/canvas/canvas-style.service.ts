import { inject, Injectable } from '@angular/core';
import { CanvasSettingsService } from './canvas-settings.service';
import { CanvasService } from './canvas.service';


@Injectable({
  providedIn: 'root'
})
export class CanvasStyleService {
  readonly #canvasSettingsService = inject(CanvasSettingsService);
  readonly #canvasService = inject(CanvasService);


  initCanvasStyles(): void {
    this.#drawBackground()

  }

  #drawBackground(): void {
    this.#canvasSettingsService.getSetting('canvasBackgroundColor');
    this.#canvasSettingsService.onSettingChange('canvasBackgroundColor').subscribe((backgroundColor: string) => {
        this.#canvasService.canvasElement.style.backgroundColor = backgroundColor
      }
    )
  }

}