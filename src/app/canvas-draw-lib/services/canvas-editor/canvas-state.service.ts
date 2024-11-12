import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EditorState, TransformState } from './models/canvas-editor.service';



@Injectable({ providedIn: 'root' })
export class CanvasStateService {

    readonly #transformState$ = new BehaviorSubject<TransformState>({
        scale: 1,
        offsetX: 0,
        offsetY: 0
    });

    readonly #editorState$ = new BehaviorSubject<EditorState>({
        stateValue: "viewMode",
        selectedPolygonId: null,
        selectedPolygon: null,
    });


    get transformState() {
        return this.#transformState$.value;
    }

    get editorState() {
        return this.#editorState$.value;
    }

    get transformState$() {
        return this.#transformState$.asObservable();
    }

    get editorState$() {
        return this.#editorState$.asObservable();
    }

    // Функция для обновления состояния трансформации
    updateTransformState(newState: Partial<TransformState>) {
        const currentState = this.#transformState$.value;
        this.#transformState$.next({
            ...currentState,
            ...newState
        });
    }

    // Функция для обновления состояния редактора
    updateEditorState(newState: Partial<EditorState>) {
        const currentState = this.#editorState$.value;
        if (newState.stateValue === "viewMode") {
            newState.selectedPolygonId = null;
            newState.selectedPolygon = null;
        }
        this.#editorState$.next({
            ...currentState,
            ...newState
        });
    }
}
