import { ChangeDetectionStrategy, Component } from "@angular/core";
import type { Router } from "@angular/router";

@Component({
    selector: "lib-performance-monitor",
    templateUrl: "./features/performance-monitor.component.html",
    styleUrls: ["./features/performance-monitor.component.scss"],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceMonitorComponent {
    private readonly d = "dsa";

    constructor(private readonly _router: Router) {
        console.log("dsadas");
    }
}
