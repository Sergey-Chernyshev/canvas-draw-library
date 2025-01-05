import { Injectable, OnDestroy } from "@angular/core";

interface ShortcutConfig {
    callback: (e: KeyboardEvent) => void;
    once?: boolean;
}

@Injectable({ providedIn: "root" })
export class KeyShortcutsService implements OnDestroy {
    private readonly shortcuts = new Map<string, ShortcutConfig>();
    private readonly pressedKeys = new Set<string>();
    private readonly triggeredCombos = new Set<string>();
    private readonly handleKeyDownBound = this.handleKeyDown.bind(this);
    private readonly handleKeyUpBound = this.handleKeyUp.bind(this);

    constructor() {
        document.addEventListener("keydown", this.handleKeyDownBound);
        document.addEventListener("keyup", this.handleKeyUpBound);
    }

    ngOnDestroy(): void {
        document.removeEventListener("keydown", this.handleKeyDownBound);
        document.removeEventListener("keyup", this.handleKeyUpBound);
    }

    registerShortcut(keys: string[], callback: (e: KeyboardEvent) => void, once?: boolean): void {
        const combo = this.normalizeCombo(keys);

        this.shortcuts.set(combo, { callback, once });
    }

    unregisterShortcut(keys: string[]): void {
        const combo = this.normalizeCombo(keys);

        this.shortcuts.delete(combo);
    }

    private handleKeyDown(e: KeyboardEvent): void {
        this.updatePressedKeys(e);

        const combo = Array.from(this.pressedKeys).sort().join("+");
        const config = this.shortcuts.get(combo);

        if (config) {
            e.preventDefault();
            e.stopPropagation();

            if (!config.once) {
                config.callback(e);
            } else if (!this.triggeredCombos.has(combo)) {
                config.callback(e);
                this.triggeredCombos.add(combo);
            }
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        this.triggeredCombos.clear();
        this.updatePressedKeys(e);
    }

    private updatePressedKeys(e: KeyboardEvent): void {
        this.pressedKeys.clear();

        if (e.ctrlKey) {
            this.pressedKeys.add("control");
        }

        if (e.altKey) {
            this.pressedKeys.add("alt");
        }

        if (e.shiftKey) {
            this.pressedKeys.add("shift");
        }

        if (e.metaKey) {
            this.pressedKeys.add("meta");
        }

        const key = e.key.toLowerCase();

        if (!["control", "alt", "shift", "meta"].includes(key)) {
            this.pressedKeys.add(key);
        }
    }

    private normalizeCombo(keys: string[]): string {
        return keys
            .map((k) => k.toLowerCase())
            .sort()
            .join("+");
    }
}
