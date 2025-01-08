import { inject, Injectable } from "@angular/core";
import { KeyShortcutsService } from "@nz/key-shortcuts";
import type { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";

import { ElementStoreService } from "../element/element-store.service";
import type { EditorState, TransformState } from "./models";

@Injectable({ providedIn: "root" })
export class CanvasStateService {
    readonly #keyShortcutService = inject(KeyShortcutsService);

    readonly #transformState$ = new BehaviorSubject<TransformState>({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
    });

    readonly #editorState$ = new BehaviorSubject<EditorState>({
        editorMode: "viewMode",
        selectedPolygonId: null,
        selectedPolygon: null,
        draftPolygon: null,
    });

    get transformState(): TransformState {
        return this.#transformState$.value;
    }

    get editorState(): EditorState {
        return this.#editorState$.value;
    }

    get transformState$(): Observable<TransformState> {
        return this.#transformState$.asObservable();
    }

    get editorState$(): Observable<EditorState> {
        return this.#editorState$.asObservable();
    }

    // Функция для обновления состояния трансформации
    updateTransformState(newState: Partial<TransformState>): void {
        const currentState = this.#transformState$.value;

        this.#transformState$.next({
            ...currentState,
            ...newState,
        });
    }

    // Функция для обновления состояния редактора
    updateEditorState(newState: Partial<EditorState>): void {
        const currentState = this.#editorState$.value;

        if (newState.editorMode === "viewMode") {
            newState.selectedPolygonId = null;
            newState.selectedPolygon = null;
            newState.draftPolygon = null;
        }

        this.#editorState$.next({
            ...currentState,
            ...newState,
        });
    }
}
