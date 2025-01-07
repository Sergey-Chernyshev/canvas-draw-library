import { inject, Injectable, Renderer2, RendererFactory2 } from "@angular/core";

import { CssCursorStyles } from "./cursor.module";

@Injectable({
    providedIn: "root",
})
export class CursorService {
    private readonly rendererFactory = inject(RendererFactory2);
    private readonly renderer: Renderer2;
    private currentCursor: CssCursorStyles | null = null;

    constructor() {
        this.renderer = this.rendererFactory.createRenderer(null, null);
    }

    /**
     * Устанавливает стиль курсора для всего окна
     * @param cursorStyle - стиль курсора (например, 'default', 'pointer', 'move')
     */
    setCursor(cursorStyle: CssCursorStyles): void {
        if (this.currentCursor !== cursorStyle) {
            this.currentCursor = cursorStyle;
            this.renderer.setStyle(document.body, "cursor", cursorStyle);
        }
    }

    /**
     * Сбрасывает стиль курсора до значения по умолчанию
     */
    resetCursor(): void {
        if (this.currentCursor !== null) {
            this.currentCursor = null;
            this.renderer.removeStyle(document.body, "cursor");
        }
    }
}
