import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { CanvasComponent } from "./canvas-draw-lib/canvas.component";

@Component({
    standalone: true,
    imports: [RouterModule, CanvasComponent],
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.less",
})
export class AppComponent {
    title = "canvas_draw";
}
