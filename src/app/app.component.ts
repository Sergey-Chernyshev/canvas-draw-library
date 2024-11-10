import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CanvasInitService } from '@untitled/canvas-draw-library';
import { CanvasComponent } from './old_library__not_used/canvas.component';

@Component({
  standalone: true,
  imports: [RouterModule, CanvasComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent {
  title = 'canvas_draw';



}
